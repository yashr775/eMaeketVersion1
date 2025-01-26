import { configureStore } from "@reduxjs/toolkit";
import { userAPI } from "./api/userAPI";
import { userReducer } from "./reducer/userReducer";
import { productAPI } from "./api/productAPI";
import { cartReducer } from "./reducer/cartReducer";
import { orderApi } from "./api/orderAPI";
import { dashboardApi } from "./api/dashboardAPI";
import { couponAPI } from "./api/couponAPI";

export const server = import.meta.env.VITE_SERVER;

export const store = configureStore({
  reducer: {
    [userAPI.reducerPath]: userAPI.reducer,
    [userReducer.name]: userReducer.reducer,
    [productAPI.reducerPath]: productAPI.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [cartReducer.name]: cartReducer.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [couponAPI.reducerPath]:couponAPI.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userAPI.middleware)
      .concat(productAPI.middleware)
      .concat(orderApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(couponAPI.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
