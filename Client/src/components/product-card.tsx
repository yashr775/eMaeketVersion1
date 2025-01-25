import { FaExpandAlt } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { CartItem } from "../types/types";
import { server } from "../redux/store";

type ProductsProps = {
  productId: string;
  photos: string;
  name: string;
  price: number;
  stock: number;
  handler: (cartItem: CartItem) => void;
};

const ProductCard = ({
  productId,
  price,
  name,
  photos,
  stock,
  handler,
}: ProductsProps) => {
  return (
    <div className="product-card">
      <img src={`${server}/${photos}`} alt={name} />
      <p>{name}</p>
      <span>₹{price}</span>

      <div>
        <button
          onClick={() =>
            handler({
              productId,
              price,
              name,
              photo: photos,
              stock,
              quantity: 1,
            })
          }
        >
          <FaPlus />
        </button>

        <Link to={`/product/${productId}`}>
          <FaExpandAlt />
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
