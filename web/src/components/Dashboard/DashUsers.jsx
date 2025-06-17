import { Button, Modal, Table } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useSelector } from "react-redux";
// Removed: import { getAllUsers, deleteUser } from "../../Utils/ApiFunctions";

// Fake users data
const fakeUsers = [
  {
    _id: "1",
    userId: "U001",
    username: "john_doe",
    email: "john@example.com",
    userPhoneNumber: "+1234567890",
    userAddress: "123 Main St, City, State",
    usertype: "Customer",
    image: "https://via.placeholder.com/40x40?text=JD",
  },
  {
    _id: "2",
    userId: "U002",
    username: "jane_smith",
    email: "jane@example.com",
    userPhoneNumber: "+1234567891",
    userAddress: "456 Oak Ave, City, State",
    usertype: "Customer",
    image: "https://via.placeholder.com/40x40?text=JS",
  },
  {
    _id: "3",
    userId: "U003",
    username: "admin_user",
    email: "admin@example.com",
    userPhoneNumber: "+1234567892",
    userAddress: "789 Admin Blvd, City, State",
    usertype: "Admin",
    image: "https://via.placeholder.com/40x40?text=AU",
  },
  {
    _id: "4",
    userId: "U004",
    username: "mike_wilson",
    email: "mike@example.com",
    userPhoneNumber: "+1234567893",
    userAddress: "321 Elm St, City, State",
    usertype: "Customer",
    image: null,
  },
  {
    _id: "5",
    userId: "U005",
    username: "sarah_johnson",
    email: "sarah@example.com",
    userPhoneNumber: "+1234567894",
    userAddress: "654 Pine Dr, City, State",
    usertype: "Customer",
    image: "https://via.placeholder.com/40x40?text=SJ",
  },
];

export default function DashUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = fakeUsers.slice(0, 5); // Show first 5 users
        setUsers(data);
        setShowMore(fakeUsers.length > 5);
      } catch (error) {
        console.log(error.message);
      }
    };
    if (currentUser?.isAdmin || currentUser?.user?.usertype === "Admin") {
      fetchUsers();
    }
  }, [currentUser]);

  const handleSort = () => {
    const sortedUsers = [...users].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.userId.localeCompare(b.userId, undefined, { numeric: true });
      }
      return b.userId.localeCompare(a.userId, undefined, { numeric: true });
    });
    setUsers(sortedUsers);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleShowMore = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const startIndex = users.length;
      const newUsers = fakeUsers.slice(startIndex, startIndex + 3);
      setUsers((prev) => [...prev, ...newUsers]);
      if (startIndex + newUsers.length >= fakeUsers.length) {
        setShowMore(false);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers((prev) => prev.filter((user) => user.userId !== userIdToDelete));
      setShowModal(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {(currentUser?.isAdmin || currentUser?.user?.usertype === "Admin") &&
      users.length > 0 ? (
        <>
          <Table hoverable className="shadow-md">
            <Table.Head>
              <Table.HeadCell onClick={handleSort} className="cursor-pointer">
                User ID {sortOrder === "asc" ? "↑" : "↓"}
              </Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Phone</Table.HeadCell>
              <Table.HeadCell>Address</Table.HeadCell>
              <Table.HeadCell>User Type</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            {users.map((user) => (
              <Table.Body className="divide-y" key={user._id}>
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell>{user.userId}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.username}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                      {user.username}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>{user.userPhoneNumber}</Table.Cell>
                  <Table.Cell>{user.userAddress}</Table.Cell>
                  <Table.Cell>{user.usertype}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setUserIdToDelete(user.userId);
                      }}
                      className="font-medium text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </span>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>
          {showMore && (
            <button
              onClick={handleShowMore}
              className="w-full text-teal-500 self-center text-sm py-7"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <p>You have no users yet!</p>
      )}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
            <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this user?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDeleteUser}>
                Yes, I'm sure
              </Button>
              <Button color="gray" onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
