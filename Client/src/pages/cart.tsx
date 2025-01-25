/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from "react";
import CartItemCard from "../components/card-item";
import { VscError } from "react-icons/vsc";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CartReducerInitialState } from "../types/reducer-types";
import { CartItem } from "../types/types";
import {
  addToCart,
  calculatePrice,
  discountApplied,
  removeCartItem,
} from "../redux/reducer/cartReducer";
import toast from "react-hot-toast";
import { server } from "../redux/store";
import axios from "axios";

const cart = () => {
  const { cartItems, discount, shippingCharges, subtotal, tax, total } =
    useSelector(
      (state: { cartReducer: CartReducerInitialState }) => state.cartReducer
    );

  const dispatch = useDispatch();

  const incrementHandler = (cartItem: CartItem) => {
    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity + 1 }));
    toast.success("Added to cart");
  };
  const decrementHandler = (cartItem: CartItem) => {
    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity - 1 }));
  };
  const removeHandler = (productId: string) => {
    dispatch(removeCartItem(productId));
  };

  const [couponCode, setCouponCode] = useState("");
  const [isValidCouponCode, setIsValidCouponCode] = useState<boolean>(false);

  useEffect(() => {
    dispatch(calculatePrice());
  }, [cartItems]);

  useEffect(() => {
    const { token: cancelToken, cancel } = axios.CancelToken.source();

    const timeOutID = setTimeout(() => {
      axios
        .get(`${server}/api/v1/payment/discount?coupon=${couponCode}`, {
          cancelToken,
        })
        .then((res) => {
          dispatch(discountApplied(res.data.discount));
          setIsValidCouponCode(true);
          // dispatch(saveCoupon(couponCode));

          dispatch(calculatePrice());
        })
        .catch(() => {
          dispatch(discountApplied(0));
          setIsValidCouponCode(false);
          dispatch(calculatePrice());
        });
    }, 1000);

    return () => {
      clearTimeout(timeOutID);
      cancel();
      setIsValidCouponCode(false);
    };
  }, [couponCode]);

  return (
    <div>
      {" "}
      <div className="cart">
        <main>
          {cartItems.length > 0 ? (
            cartItems.map((i, idx) => (
              <CartItemCard
                incrementHandler={incrementHandler}
                decrementHandler={decrementHandler}
                removeHandler={removeHandler}
                key={idx}
                cartItem={i}
              />
            ))
          ) : (
            <h1>No Items Added</h1>
          )}
        </main>
        <aside>
          <p>Subtotal: ₹{subtotal}</p>
          <p>Shipping Charges: ₹{shippingCharges}</p>
          <p>Tax: ₹{tax}</p>
          <p>
            Discount: <em className="red"> - ₹{discount}</em>
          </p>
          <p>
            <b>Total: ₹{total}</b>
          </p>

          <input
            type="text"
            placeholder="Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />

          {couponCode &&
            (isValidCouponCode ? (
              <span className="green">
                ₹{discount} off using the <code>{couponCode}</code>
              </span>
            ) : (
              <span className="red">
                Invalid Coupon <VscError />
              </span>
            ))}

          {cartItems.length > 0 && <Link to="/shipping">Checkout</Link>}
        </aside>
      </div>
    </div>
  );
};

export default cart;
