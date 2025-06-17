import React, { useEffect, useState } from "react";
import { Table, Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import LoadingSpinner from "../Loading/loadingSpinner";

const categories = [
  { categoryId: 1, categoryName: "Combo Pc" },
  { categoryId: 2, categoryName: "Bo mạch chủ" },
  { categoryId: 3, categoryName: "Bộ vi xử lý" },
  { categoryId: 4, categoryName: "RAM" },
  { categoryId: 5, categoryName: "Ổ cứng HDD" },
  { categoryId: 6, categoryName: "Ổ cứng SSD" },
  { categoryId: 7, categoryName: "Card đồ họa" },
  { categoryId: 8, categoryName: "Nguồn điện PSU" },
  { categoryId: 9, categoryName: "CPU Fan" },
  { categoryId: 10, categoryName: "Ổ đĩa quang" },
  { categoryId: 11, categoryName: "Card mạng" },
  { categoryId: 12, categoryName: "Vỏ máy tính" },
];

// Fake products data
const fakeProducts = [
  {
    productId: "P001",
    productName: "Gaming PC Setup Pro RTX 4080",
    productDescription:
      "High-performance gaming computer with RTX 4080 graphics card",
    productPrice: 2500,
    image: "https://via.placeholder.com/200x200?text=Gaming+PC",
    categoryId: 1,
    isActive: "active",
  },
  {
    productId: "P002",
    productName: "ASUS ROG Strix Z690-E",
    productDescription: "Premium motherboard for Intel 12th gen processors",
    productPrice: 450,
    image: "https://via.placeholder.com/200x200?text=Motherboard",
    categoryId: 2,
    isActive: "active",
  },
  {
    productId: "P003",
    productName: "Intel Core i7-13700K",
    productDescription:
      "Latest 13th gen Intel processor for gaming and productivity",
    productPrice: 420,
    image: "https://via.placeholder.com/200x200?text=CPU",
    categoryId: 3,
    isActive: "active",
  },
  {
    productId: "P004",
    productName: "Corsair Vengeance RGB Pro 32GB DDR4",
    productDescription: "High-performance RGB memory kit for gaming",
    productPrice: 180,
    image: "https://via.placeholder.com/200x200?text=RAM",
    categoryId: 4,
    isActive: "active",
  },
  {
    productId: "P005",
    productName: "Seagate Barracuda 2TB HDD",
    productDescription: "Reliable storage solution for bulk data",
    productPrice: 60,
    image: "https://via.placeholder.com/200x200?text=HDD",
    categoryId: 5,
    isActive: "inactive",
  },
  {
    productId: "P006",
    productName: "Samsung 980 PRO 1TB NVMe SSD",
    productDescription: "Ultra-fast NVMe SSD for lightning-quick boot times",
    productPrice: 120,
    image: "https://via.placeholder.com/200x200?text=SSD",
    categoryId: 6,
    isActive: "active",
  },
  {
    productId: "P007",
    productName: "NVIDIA RTX 4090 24GB",
    productDescription:
      "Top-tier graphics card for 4K gaming and content creation",
    productPrice: 1600,
    image: "https://via.placeholder.com/200x200?text=GPU",
    categoryId: 7,
    isActive: "active",
  },
  {
    productId: "P008",
    productName: "Corsair RM850x 850W PSU",
    productDescription: "Fully modular 80+ Gold certified power supply",
    productPrice: 150,
    image: "https://via.placeholder.com/200x200?text=PSU",
    categoryId: 8,
    isActive: "active",
  },
  {
    productId: "P009",
    productName: "Noctua NH-D15 CPU Cooler",
    productDescription:
      "Premium air cooler for maximum CPU cooling performance",
    productPrice: 100,
    image: "https://via.placeholder.com/200x200?text=Cooler",
    categoryId: 9,
    isActive: "inactive",
  },
];

const DashPosts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const data = fakeProducts.slice(0, 6); // Show first 6 products
      setProducts(data);
      setShowMore(fakeProducts.length > 6);
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProducts((prev) =>
        prev.filter((product) => product.productId !== productIdToDelete)
      );
      setShowDeleteModal(false);
      setDeleteError(null);
    } catch (error) {
      setDeleteError(error.message);
    }
  };

  const handleToggleActive = async (productId, currentStatus) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      setProducts((prev) =>
        prev.map((product) =>
          product.productId === productId
            ? { ...product, isActive: newStatus }
            : product
        )
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.categoryName : "Unknown Category";
  };

  const handleShowMore = async () => {
    setLoadingMore(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const startIndex = products.length;
      const newProducts = fakeProducts.slice(startIndex, startIndex + 3);
      setProducts((prev) => [...prev, ...newProducts]);
      setShowMore(startIndex + newProducts.length < fakeProducts.length);
    } catch (error) {
      console.error("Error fetching more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">All Products</h2>
        <Link to="/create-post">
          <Button gradientDuoTone="purpleToPink">Add New Product</Button>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Image</Table.HeadCell>
              <Table.HeadCell>Product Details</Table.HeadCell>
              <Table.HeadCell>Price</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {products.map((product) => (
                <Table.Row
                  key={product.productId}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell>
                    <img
                      src={product.image}
                      alt={product.productName}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {product.productName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {product.productDescription}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">
                      ${parseFloat(product.productPrice).toLocaleString()}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{getCategoryName(product.categoryId)}</Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={() =>
                        handleToggleActive(product.productId, product.isActive)
                      }
                      className={`px-3 py-1 rounded-full text-sm ${
                        product.isActive === "active"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {product.isActive === "active" ? "Active" : "Inactive"}
                    </button>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Link
                        to={`/update-post/${product.productId}`}
                        className="font-medium text-teal-500 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          setProductIdToDelete(product.productId);
                          setShowDeleteModal(true);
                        }}
                        className="font-medium text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {showMore && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleShowMore}
                outline
                gradientDuoTone="purpleToPink"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Show More"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-xl text-gray-500">No products found</p>
          <Link to="/create-post">
            <Button gradientDuoTone="purpleToPink" className="mt-4">
              Create Your First Product
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
            <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this product?
            </h3>
            {deleteError && <p className="text-red-500 mb-4">{deleteError}</p>}
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDeleteProduct}>
                Yes, I'm sure
              </Button>
              <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DashPosts;
