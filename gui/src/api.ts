import { MASTER_URL } from "./config";

export const fetchFromBackend = async (
  url: string,
  method: string,
  body?: any
) => {
  const request = new Request(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const response = await fetch(request);

  if (response.status === 500) {
    throw new Error("Internal server error");
  }

  const data = await response.json();

  if (response.status > 400 && response.status < 500) {
    if (data.detail) {
      throw data.detail;
    }
    throw data;
  }

  return data;
};

export const getProducts = async (
  limit = 15,
  skip = 0,
  gender = "",
  category = ""
) => {
  var params: string;
  if (gender == "" && category == "") {
    var params = `?limit=${limit}&skip=${skip}`;
  } else {
    if (gender != "" && category != "") {
      var params = `?limit=${limit}&skip=${skip}&gender=${gender}&category=${category}`;
    } else if (gender != "") {
      var params = `?limit=${limit}&skip=${skip}&gender=${gender}`;
    } else {
      var params = `?limit=${limit}&skip=${skip}&category=${category}`;
    }
  }
  return fetchFromBackend(`${MASTER_URL}${params}`, "GET");
};
// get products from Redis through the FastAPI backend

export const getProductsByText = async (
  search_text: string,
  is_openai: boolean,
  limit = 15,
  skip = 0
) => {
  // TODO use limit and skip to paginate through search results
  let body = {
    text: search_text,
    number_of_results: limit,
    is_openai: is_openai,
  };

  const url = MASTER_URL + "search?limit=" + limit;
  return fetchFromBackend(url, "POST", body);
};

export const getVisuallySimilarProducts = async (
  id: number,
  is_openai: boolean,
  search = "KNN",
  gender = "",
  category = "",
  limit = 15,
  skip = 0
) => {
  let body = {
    product_id: id,
    search_type: search,
    gender: gender,
    category: category,
    number_of_results: limit,
    is_openai: is_openai,
  };

  const url = MASTER_URL + "vectorsearch/image";
  return fetchFromBackend(url, "POST", body);
};

export const getSemanticallySimilarProducts = async (
  id: number,
  is_openai: boolean,
  search = "KNN",
  gender = "",
  category = "",
  limit = 15,
  skip = 0
) => {
  let body = {
    product_id: id,
    search_type: search,
    gender: gender,
    category: category,
    number_of_results: limit,
    is_openai: is_openai,
  };

  const url = MASTER_URL + "vectorsearch/text";
  return fetchFromBackend(url, "POST", body);
};

export const getSemanticallySimilarProductsbyText = async (
  text: string,
  is_openai: boolean,
  gender = "",
  category = "",
  search = "KNN",
  limit = 15,
  skip = 0
) => {
  let body = {
    user_text: text,
    search_type: search,
    number_of_results: limit,
    gender: gender,
    category: category,
    is_openai: is_openai,
  };

  const url = MASTER_URL + "vectorsearch/user";
  return fetchFromBackend(url, "POST", body);
};
