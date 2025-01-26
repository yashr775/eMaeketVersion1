import { ReactElement, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Column } from "react-table";
import AdminSidebar from "../../components/admin/AdminSidebar";
import TableHOC from "../../components/admin/TableHOC";
import { Skeleton } from "../../components/loader";
import { RootState } from "../../redux/store";
import { useAllCouponsQuery } from "../../redux/api/couponAPI";

interface DataType {
  code: string;
  amount: number;
  _id: string;
  action: ReactElement;
}

const columns: Column<DataType>[] = [
  {
    Header: "Id",
    accessor: "_id",
  },

  {
    Header: "Code",
    accessor: "code",
  },
  {
    Header: "Amount",
    accessor: "amount",
  },
  {
    Header: "Action",
    accessor: "action",
  },
];

const Discount = () => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  console.log(user!._id);
  const { data, isLoading, error } = useAllCouponsQuery(user!._id);
  const [rows, setRows] = useState<DataType[]>([]);

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Products",
    rows.length > 6
  )();
  console.log(error);

  useEffect(() => {
    if (data)
      setRows(
        data.coupons.map((i) => ({
          _id: i._id,
          code: i.code,
          amount: i.amount,
          action: <Link to={`/admin/discount/${i._id}`}>Manage</Link>,
        }))
      );
  }, [data]);

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main>{isLoading ? <Skeleton length={20} /> : Table}</main>
      <Link to="/admin/discount/new" className="create-product-btn">
        <FaPlus />
      </Link>
    </div>
  );
};

export default Discount;
