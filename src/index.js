import React, { useEffect } from "react";
import { init } from "./store/globalData";
import { transform } from "./helpers/utils";

const ConfigRenderer = ({ tree, handlers, obj }) => {
  useEffect(() => {
    import("@idfy/lokey-core-components");
  });
  init(obj);
  const component = transform(tree, handlers);

  return component;
};

export default ConfigRenderer;
