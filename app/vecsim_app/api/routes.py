import asyncio
import typing as t

import numpy as np
import redis.asyncio as redis
from fastapi import APIRouter

from vecsim_app import TEXT_MODEL
from vecsim_app import config
from vecsim_app.models import Product
from vecsim_app.query import create_query, count
from vecsim_app.schema import (
    SimilarityRequest,
    SearchRequest,
    UserTextSimilarityRequest
)

product_router = r = APIRouter()
redis_client = redis.from_url(config.REDIS_URL)


async def process_product(p, i: int):
    product = await Product.get(p.product_pk)
    product = product.dict()
    score = 1 - float(p.vector_score) if i > 0 else 1.0
    product['similarity_score'] = score
    return product


async def products_from_results(total, results) -> list:
    # extract products from VSS results
    return {
        'total': total,
        'products': [
            await process_product(p, i)
            for i, p in enumerate(results.docs)
        ]
    }


@r.get("/", response_model=t.Dict,
       name="product:get_product_samples",
       operation_id="get_products_samples")
async def get_products(limit: int = 20, skip: int = 0, gender: str = "", category: str = ""):
    products = []
    expressions = []
    if gender and category:
        expressions.append(
            (Product.product_metadata.gender == gender) & \
            (Product.product_metadata.master_category == category)
        )
    elif gender and not category:
        expressions.append(Product.product_metadata.gender == gender)
    elif category and not gender:
        expressions.append(Product.product_metadata.master_category == category)
    # Run query
    products = await Product.find(*expressions) \
        .copy(offset=skip, limit=limit) \
        .execute(exhaust_results=False)
    # Get total count
    total = (
        await redis_client.ft(config.INDEX_NAME).search(
            count(gender=gender, category=category)
        )
    ).total
    return {
        'total': total,
        'products': products
    }


@r.post("/search",
        response_model=t.List[Product],
        name="product:text_search",
        operation_id="text_search")
async def text_search_products(search: SearchRequest):
    num_products = search.number_of_results
    finder = Product.find(
        Product.product_metadata.name % search.text
    )
    products = await finder.copy(offset=0, limit=num_products).execute()
    return products


@r.post("/vectorsearch/image",
        response_model=t.Dict,
        name="product:find_similar_by_image",
        operation_id="compute_image_similarity")
async def find_products_by_image(similarity_request: SimilarityRequest) -> t.Dict:
    field = "img_vector"
    index = config.INDEX_NAME
    if similarity_request.is_openai:
        index = config.OPENAI_INDEX_NAME

    query = create_query(
        similarity_request.return_fields,
        similarity_request.search_type,
        similarity_request.number_of_results,
        vector_field_name=field,
        gender=similarity_request.gender,
        category=similarity_request.category
    )
    count_query = count(
        gender=similarity_request.gender,
        category=similarity_request.category
    )

    # find the vector of the Product listed in the request
    product_vector_key = "product_vector:" + str(similarity_request.product_id)
    vector = await redis_client.hget(product_vector_key, field)

    # obtain results of the query
    total, results = await asyncio.gather(
        redis_client.ft(index).search(count_query),
        redis_client.ft(index).search(query, query_params={"vec_param": vector})
    )

    # Get Product records of those results
    return await products_from_results(total.total, results)


@r.post("/vectorsearch/text",
        response_model=t.Dict,
        name="product:find_similar_by_text",
        operation_id="compute_text_similarity")
async def find_products_by_text(similarity_request: SimilarityRequest) -> t.Dict:
    field = "text_vector"
    index = config.INDEX_NAME
    if similarity_request.is_openai:
        field = "openai_text_vector"
        index = config.OPENAI_INDEX_NAME

    query = create_query(
        similarity_request.return_fields,
        similarity_request.search_type,
        similarity_request.number_of_results,
        vector_field_name=field,
        gender=similarity_request.gender,
        category=similarity_request.category
    )
    count_query = count(
        gender=similarity_request.gender,
        category=similarity_request.category
    )

    # find the vector of the Product listed in the request
    product_vector_key = "product_vector:" + str(similarity_request.product_id)
    vector = await redis_client.hget(product_vector_key, field)

    # obtain results of the query
    total, results = await asyncio.gather(
        redis_client.ft(index).search(count_query),
        redis_client.ft(index).search(query, query_params={"vec_param": vector})
    )

    # Get Product records of those results
    return await products_from_results(total.total, results)


@r.post("/vectorsearch/user",
        response_model=t.Dict,
        name="product:find_similar_by_user_text",
        operation_id="compute_user_text_similarity")
async def find_products_by_user_text(similarity_request: UserTextSimilarityRequest) -> t.Dict:
    field = "text_vector"
    index = config.INDEX_NAME
    vector = TEXT_MODEL.encode(similarity_request.user_text).astype(np.float32).tobytes()
    if similarity_request.is_openai:
        field = "openai_text_vector"
        index = config.OPENAI_INDEX_NAME
        vector = get_embeddings_from_openai(similarity_request.user_text)

    query = create_query(
        similarity_request.return_fields,
        similarity_request.search_type,
        similarity_request.number_of_results,
        vector_field_name=field,
        gender=similarity_request.gender,
        category=similarity_request.category
    )
    count_query = count(
        gender=similarity_request.gender,
        category=similarity_request.category
    )

    # obtain results of the query
    total, results = await asyncio.gather(
        redis_client.ft(index).search(count_query),
        redis_client.ft(index).search(query, query_params={"vec_param": vector})
    )

    # Get Product records of those results
    return await products_from_results(total.total, results)


def get_embeddings_from_openai(query: str) -> bytes:
    import json
    import requests

    proxy = "http://192.168.2.40:10809"
    url = 'https://api.openai.com/v1/embeddings'

    proxies = {
        'http': proxy,
        'https': proxy
    }

    session = requests.Session()
    session.proxies.update(proxies)

    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + "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"
    }

    data = {
        'input': query,
        'model': 'text-embedding-ada-002'
    }

    response = session.post(url, headers=headers, data=json.dumps(data))

    if response.status_code != 200:
        print(response.text)
        raise Exception(response.text)

    response_json = response.json()
    embeddings = response_json['data'][0]['embedding']
    return np.array(embeddings, dtype=np.float32).tobytes()
