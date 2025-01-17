import typing as t

from redis.asyncio import Redis
from redis.commands.search.field import (
    VectorField,
    TagField
)
from redis.commands.search.indexDefinition import (
    IndexDefinition,
    IndexType
)
from redis.commands.search.query import Query

from config import INDEX_NAME, OPENAI_INDEX_NAME


async def create_index(
        redis_conn: Redis,
        prefix: str,
        image_field: VectorField,
        text_field: VectorField
):
    category_field = TagField("category")
    gender_field = TagField("gender")
    # Create index
    await redis_conn.ft(INDEX_NAME).create_index(
        fields=[image_field, text_field, category_field, gender_field],
        definition=IndexDefinition(prefix=[prefix], index_type=IndexType.HASH)
    )


async def create_openai_index(
        redis_conn: Redis,
        prefix: str,
        image_field: VectorField,
        text_field: VectorField
):
    category_field = TagField("category")
    gender_field = TagField("gender")
    # Create index
    await redis_conn.ft(OPENAI_INDEX_NAME).create_index(
        fields=[image_field, text_field, category_field, gender_field],
        definition=IndexDefinition(prefix=[prefix], index_type=IndexType.HASH)
    )


async def create_flat_index(
        redis_conn: Redis,
        number_of_vectors: int,
        prefix: str,
        distance_metric: str = 'L2'
):
    image_field = VectorField("img_vector",
                              "FLAT", {
                                  "TYPE": "FLOAT32",
                                  "DIM": 512,
                                  "DISTANCE_METRIC": distance_metric,
                                  "INITIAL_CAP": number_of_vectors,
                                  "BLOCK_SIZE": number_of_vectors
                              })
    text_field = VectorField("text_vector",
                             "FLAT", {
                                 "TYPE": "FLOAT32",
                                 "DIM": 768,
                                 "DISTANCE_METRIC": distance_metric,
                                 "INITIAL_CAP": number_of_vectors,
                                 "BLOCK_SIZE": number_of_vectors
                             })
    await create_index(redis_conn, prefix, image_field, text_field)


async def create_hnsw_index(
        redis_conn: Redis,
        number_of_vectors: int,
        prefix: str,
        distance_metric: str = 'COSINE'
):
    image_field = VectorField("img_vector",
                              "HNSW", {
                                  "TYPE": "FLOAT32",
                                  "DIM": 512,
                                  "DISTANCE_METRIC": distance_metric,
                                  "INITIAL_CAP": number_of_vectors,
                              })
    text_field = VectorField("text_vector",
                             "HNSW", {
                                 "TYPE": "FLOAT32",
                                 "DIM": 768,
                                 "DISTANCE_METRIC": distance_metric,
                                 "INITIAL_CAP": number_of_vectors,
                             })
    await create_index(redis_conn, prefix, image_field, text_field)


async def create_openai_hnsw_index(
        redis_conn: Redis,
        number_of_vectors: int,
        prefix: str,
        distance_metric: str = 'COSINE'
):
    image_field = VectorField("img_vector",
                              "HNSW", {
                                  "TYPE": "FLOAT32",
                                  "DIM": 512,
                                  "DISTANCE_METRIC": distance_metric,
                                  "INITIAL_CAP": number_of_vectors,
                              })
    text_field = VectorField("openai_text_vector",
                             "HNSW", {
                                 "TYPE": "FLOAT32",
                                 "DIM": 1536,
                                 "DISTANCE_METRIC": distance_metric,
                                 "INITIAL_CAP": number_of_vectors,
                             })
    await create_openai_index(redis_conn, prefix, image_field, text_field)


def create_query(
        return_fields: list,
        search_type: str = "KNN",
        number_of_results: int = 20,
        vector_field_name: str = "img_vector",
        gender: t.Optional[str] = None,
        category: t.Optional[str] = None
):
    tag = "("
    if gender:
        tag += f"@gender:{{{gender}}}"
    if category:
        tag += f"@category:{{{category}}}"
    tag += ")"
    # if no tags are selected
    if len(tag) < 3:
        tag = "*"

    base_query = f'{tag}=>[{search_type} {number_of_results} @{vector_field_name} $vec_param AS vector_score]'
    return Query(base_query) \
        .sort_by("vector_score") \
        .paging(0, number_of_results) \
        .return_fields(*return_fields) \
        .dialect(2)


def count(gender: t.Optional[str] = None, category: t.Optional[str] = None):
    tag = "("
    if gender:
        tag += f"@gender:{{{gender}}}"
    if category:
        tag += f"@category:{{{category}}}"
    tag += ")"
    # if no tags are selected
    if len(tag) < 3:
        tag = "*"

    return Query(f'{tag}') \
        .no_content() \
        .dialect(2)
