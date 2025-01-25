import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { lazy, Suspense, useEffect } from "react";
import Loader from "./components/loader";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useDispatch, useSelector } from "react-redux";
import { userExist, userNotExist } from "./redux/reducer/userReducer";
import { getUser } from "./redux/api/userAPI";
import { UserReducerInitialState } from "./types/reducer-types";
import ProtectedRoute from "./components/protected-route";
const Checkout = lazy(() => import("./pages/checkout"));

const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/cart"));
const Search = lazy(() => import("./pages/search"));
const Dashboard = lazy(() => import("./pages/pages/Dashboard"));
const Products = lazy(() => import("./pages/pages/Products"));
const Transaction = lazy(() => import("./pages/pages/Transaction"));
const Customers = lazy(() => import("./pages/pages/Customers"));
const BarCharts = lazy(() => import("./pages/pages/Charts/Barcharts"));
const PieCharts = lazy(() => import("./pages/pages/Charts/PieCharts"));
const LineCharts = lazy(() => import("./pages/pages/Charts/LineCharts"));
const NewProduct = lazy(() => import("./pages/pages/management/NewProduct"));
const Header = lazy(() => import("./components/Header"));

const ProductManagement = lazy(
  () => import("./pages/pages/management/ProductManagement")
);
const TransactionManagement = lazy(
  () => import("./pages/pages/management/TransactionManagement")
);

const Stopwatch = lazy(() => import("./pages/pages/apps/Stopwatch"));
const Toss = lazy(() => import("./pages/pages/apps/Toss"));
const Coupon = lazy(() => import("./pages/pages/apps/Coupon"));
const Shipping = lazy(() => import("./pages/shipping"));
const Login = lazy(() => import("./pages/login"));
const Orders = lazy(() => import("./pages/orders"));
const NotFound = lazy(() => import("./pages/not-found"));

const App = () => {
  const { user, loading } = useSelector(
    (state: { userReducer: UserReducerInitialState }) => state.userReducer
  );

  const dispatch = useDispatch();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const data = await getUser(user.uid);
        dispatch(userExist(data.user));
      } else {
        dispatch(userNotExist());
      }
    });
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <Router>
      <Suspense fallback={<Loader />}>
        <Header user={user} />
        <Routes>
          <Route path={"/"} element={<Home />}></Route>
          <Route path={"/search"} element={<Search />}></Route>
          <Route path={"/cart"} element={<Cart />}></Route>
          <Route
            path={"/login"}
            element={
              <ProtectedRoute isAuthenticated={user ? false : true}>
                <Login />
              </ProtectedRoute>
            }
          ></Route>

          {/* Protected Route */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={user ? true : false}
              ></ProtectedRoute>
            }
          >
            {" "}
            <Route path="/orders" element={<Orders />} />
            <Route path={"/shipping"} element={<Shipping />}></Route>
            <Route path="/pay" element={<Checkout />} />
          </Route>

          {/* Admin Route */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={true}
                adminOnly={true}
                admin={user?.role === "admin" ? true : false}
              />
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/product" element={<Products />} />
            <Route path="/admin/transaction" element={<Transaction />} />
            <Route path="/admin/customers" element={<Customers />} />

            <Route path="/admin/chart/bar" element={<BarCharts />} />
            <Route path="/admin/chart/pie" element={<PieCharts />} />
            <Route path="/admin/chart/line" element={<LineCharts />} />

            <Route path="/admin/product/new" element={<NewProduct />} />
            <Route path="/admin/product/:id" element={<ProductManagement />} />
            <Route
              path="/admin/transaction/:id"
              element={<TransactionManagement />}
            />

            <Route path="/admin/app/stopwatch" element={<Stopwatch />} />
            <Route path="/admin/app/coupon" element={<Coupon />} />
            <Route path="/admin/app/toss" element={<Toss />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-center" />
    </Router>
  );
};

export default App;
