import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AllDiscountResponse,
  SingleDiscountResponse,
} from "../../types/api-types";

export const couponAPI = createApi({
  reducerPath: "couponApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/payment/coupon/`,
  }),
  tagTypes: ["coupon"],
  endpoints: (builder) => ({
    // latestProducts: builder.query<AllProductsResponse, void>({
    //   query: () => "latest",
    //   providesTags: ["coupon"],
    // }),

    allCoupons: builder.query<AllDiscountResponse, string>({
      query: (id) => `all?id=${id}`,
      providesTags: ["coupon"],
    }),
    oneCoupon: builder.query<
      SingleDiscountResponse,
      { id: string; couponId: string }
    >({
      query: ({ id, couponId }) => `${couponId}/id=${id}`,
      providesTags: ["coupon"],
    }),
  }),
});

export const { useAllCouponsQuery, useOneCouponQuery } = couponAPI;