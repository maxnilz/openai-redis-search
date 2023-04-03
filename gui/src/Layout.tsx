import React, { FC, useState } from "react";

import { Home } from "./views/Home";

export const Layout: FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [gender, setGender] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [total, setTotal] = useState<number>(0);

  return (
    <>
      <Home
        setProducts={setProducts}
        products={products}
        gender={gender}
        category={category}
        total={total}
        setTotal={setTotal}
        setGender={setGender}
        setCategory={setCategory}
      />
    </>
  );
};

export default Layout;
