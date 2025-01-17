from pydantic import BaseModel

DEFAULT_RETURN_FIELDS = ["product_id", "product_pk", "vector_score"]


class SimilarityRequest(BaseModel):
    product_id: int
    number_of_results: int = 15
    search_type: str = "KNN"
    gender: str = ""
    category: str = ""
    is_openai: bool = False,
    return_fields: list = DEFAULT_RETURN_FIELDS


class SearchRequest(BaseModel):
    text: str
    number_of_results: int = 15
    is_openai: bool = False,
    return_fields: list = DEFAULT_RETURN_FIELDS


class UserTextSimilarityRequest(BaseModel):
    user_text: str
    number_of_results: int = 15
    search_type: str = "KNN"
    gender: str = ""
    category: str = ""
    is_openai: bool = False,
    return_fields: list = DEFAULT_RETURN_FIELDS
