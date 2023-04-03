import { useState, useEffect } from "react";
import {
  getProducts,
  getProductsByText,
  getSemanticallySimilarProductsbyText,
} from "../api";
import { useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { TagRadios } from "../radio";
import { Chip } from "@material-ui/core";
import Tooltip from "@mui/material/Tooltip";
import SearchInput from "./Search";
import CustomCheckbox from "./CheckBox";

/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface Props {
  products: any[];
  setProducts: (state: any) => void;
  gender: string;
  setGender: (state: any) => void;
  category: string;
  setCategory: (state: any) => void;
  total: number;
  setTotal: (state: any) => void;
}

export const Home = (props: Props) => {
  const [error, setError] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(15);
  const [isOpenAI, setIsOpenAI] = useState(false);
  const Navigate = useNavigate();

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setIsOpenAI(checked);
  };

  const handleSearchv0 = async (query: string) => {
    try {
      const result = await getProductsByText(query, isOpenAI, limit, skip);
      props.setProducts(result);
      props.setTotal(result.length);
      setSearchText(query);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const result = await getSemanticallySimilarProductsbyText(
        query,
        isOpenAI,
        props.gender,
        props.category
      );
      props.setProducts(result.products);
      props.setTotal(result.total);
      setSearchText(query);
    } catch (err) {
      setError(String(err));
    }
  };

  const queryProducts = async () => {
    try {
      const result = await getProducts(
        limit,
        skip,
        props.gender,
        props.category
      );
      props.setProducts(result.products);
      props.setTotal(result.total);
      setSearchText("");
    } catch (err) {
      setError(String(err));
    }
  };

  const queryProductsWithLimit = async () => {
    try {
      setSkip(skip + limit);
      queryProducts();
      setSearchText("");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    queryProductsWithLimit();
  }, [props.gender, props.category]);

  // Execute this one when the component loads up
  useEffect(() => {
    // clear filters
    props.setGender("");
    props.setCategory("");
    queryProductsWithLimit();
  }, []);

  return (
    <>
      <main role="main">
        <section
          className="jumbotron text-center mb-0 bg-white"
          style={{ paddingTop: "40px" }}
        >
          <div className="container">
            <h1 className="jumbotron-heading">Fashion Product Finder</h1>
            <div>
              <SearchInput onSearch={handleSearch} />
            </div>
            <div>
              <CustomCheckbox
                label="Use OpenAI embeddings"
                checked={isOpenAI}
                onChange={handleCheckboxChange}
              />
            </div>
            <div>
              <div className="btn-group">
                {props.products.length > 0 ? (
                  <div>
                    <TagRadios
                      gender={props.gender}
                      category={props.category}
                      setGender={props.setGender}
                      setCategory={props.setCategory}
                    />
                  </div>
                ) : (
                  <></>
                )}
                <Tooltip title="Fetch more products from Redis" arrow>
                  <a
                    className="btn btn-primary m-2"
                    onClick={() => queryProductsWithLimit()}
                  >
                    Load More Products
                  </a>
                </Tooltip>
              </div>
            </div>
          </div>
        </section>
        <div className="album py-5 bg-light">
          <div className="container">
            <p style={{ fontSize: 15 }}>
              <Tooltip title="Filtered product count" arrow>
                <em>
                  {searchText !== "" ? "show only" : ""} {props.total}{" "}
                  searchable products{" "}
                  {searchText !== "" ? "for " + searchText : ""}
                </em>
              </Tooltip>
            </p>
            <div>
              {props.category !== "" ? (
                <Chip
                  style={{ margin: "5px 5px 25px 5px" }}
                  label={`Category: ${props.category}`}
                  variant="outlined"
                  clickable
                  color="primary"
                  onDelete={() => {
                    props.setCategory("");
                    queryProducts();
                  }}
                  disabled={props.category === ""}
                />
              ) : (
                <></>
              )}
              {props.gender !== "" ? (
                <Chip
                  style={{ margin: "5px 5px 25px 5px" }}
                  label={`Gender: ${props.gender}`}
                  variant="outlined"
                  clickable
                  color="primary"
                  onDelete={() => {
                    props.setGender("");
                    queryProducts();
                  }}
                  disabled={props.gender === ""}
                />
              ) : (
                <></>
              )}
              {searchText !== "" ? (
                <Chip
                  style={{ margin: "5px 5px 25px 5px" }}
                  label={`Search Text: ${searchText}`}
                  variant="outlined"
                  clickable
                  color="primary"
                  onDelete={() => {
                    setSearchText("");
                    queryProducts();
                  }}
                  disabled={searchText === ""}
                />
              ) : (
                <></>
              )}
            </div>
            {props.products && (
              <div className="row">
                {props.products.map((product) => (
                  <Card
                    key={product.pk}
                    image_path={product.product_metadata.image_url}
                    name={product.product_metadata.name}
                    text={product.product_metadata.text}
                    productId={product.product_id}
                    numProducts={15}
                    similarity_score={product.similarity_score}
                    gender={props.gender}
                    category={props.category}
                    is_openai={isOpenAI}
                    setProducts={props.setProducts}
                    setTotal={props.setTotal}
                    setSearchText={setSearchText}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};
