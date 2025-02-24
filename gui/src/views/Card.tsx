/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  getVisuallySimilarProducts,
  getSemanticallySimilarProducts,
} from "../api";
import useCheckMobileScreen from "../mobile";
import { Chip } from "@material-ui/core";
import Tooltip from "@mui/material/Tooltip";

interface Props {
  productId: number;
  numProducts: number;
  image_path: string;
  name: string;
  text: string;
  gender: string;
  category: string;
  similarity_score: number;
  is_openai: boolean;
  setProducts: (state: any) => void;
  setTotal: (state: any) => void;
  setSearchText: (state: any) => void;
}

export const Card = (props: Props) => {
  const isMobile = useCheckMobileScreen();

  const queryVisuallySimilarProducts = async () => {
    try {
      const res = await getVisuallySimilarProducts(
        props.productId,
        props.is_openai,
        "KNN",
        props.gender,
        props.category,
        props.numProducts
      );
      props.setProducts(res.products);
      props.setTotal(res.total);
      props.setSearchText("");
    } catch (err) {
      console.log(String(err));
    }
  };

  const querySemanticallySimilarProducts = async () => {
    try {
      const res = await getSemanticallySimilarProducts(
        props.productId,
        props.is_openai,
        "KNN",
        props.gender,
        props.category,
        props.numProducts
      );
      props.setProducts(res.products);
      props.setTotal(res.total);
      props.setSearchText("");
    } catch (err) {
      console.log(String(err));
    }
  };

  const getCardSize = () => {
    if (isMobile) {
      return "50%";
    } else {
      return "20%";
    }
  };

  return (
    <div className="col-md-2" style={{ width: getCardSize() }}>
      <div className="card mb-2 box-shadow" style={{ alignContent: "center" }}>
        <img
          className="card-img-top"
          style={{ height: "60%", width: "60%", alignSelf: "center" }}
          src={props.image_path}
          alt={props.name}
        />
        <div className="card-body">
          <Tooltip title={props.text} arrow>
            <p className="card-text">{props.name}</p>
          </Tooltip>

          <div style={{ alignContent: "left" }}>
            <b>View Similar:</b>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="btn-group">
              <Tooltip title="Search for similar products by text" arrow>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => querySemanticallySimilarProducts()}
                  style={{ fontSize: 12 }}
                >
                  By Text
                </button>
              </Tooltip>
              <Tooltip title="Search for similar products by image" arrow>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => queryVisuallySimilarProducts()}
                  style={{ fontSize: 12 }}
                >
                  By Image
                </button>
              </Tooltip>
            </div>
            <div className="btn-group">
              {props.similarity_score ? (
                <Tooltip title="Similarity Score" arrow>
                  <Chip
                    style={{ margin: "auto", fontSize: 12 }}
                    label={props.similarity_score.toFixed(2)}
                    color="primary"
                  />
                </Tooltip>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
