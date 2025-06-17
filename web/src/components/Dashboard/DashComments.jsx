import { Button, Modal, Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useSelector } from "react-redux";

// Fake comments data
const fakeComments = [
  {
    _id: "1",
    content:
      "This is an amazing gaming PC build guide! Thanks for sharing the detailed specs and pricing.",
    postId: { title: "Gaming PC Build Guide 2024" },
    userId: { username: "gamer_pro123" },
    numberOfLikes: 15,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    _id: "2",
    content:
      "Great recommendations for budget graphics cards. The RTX 4060 is perfect for 1080p gaming.",
    postId: { title: "Best Graphics Cards for Budget Gaming" },
    userId: { username: "budget_builder" },
    numberOfLikes: 8,
    createdAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-14T15:45:00Z",
  },
  {
    _id: "3",
    content: "Love the clean setup! Where did you get that monitor arm?",
    postId: { title: "Office Setup Essentials" },
    userId: { username: "workspace_lover" },
    numberOfLikes: 5,
    createdAt: "2024-01-13T09:20:00Z",
    updatedAt: "2024-01-13T09:20:00Z",
  },
  {
    _id: "4",
    content:
      "RGB lighting really makes a difference in the aesthetic. Nice tutorial!",
    postId: { title: "RGB Lighting Tips and Tricks" },
    userId: { username: "rgb_master" },
    numberOfLikes: 12,
    createdAt: "2024-01-12T20:15:00Z",
    updatedAt: "2024-01-12T20:15:00Z",
  },
  {
    _id: "5",
    content:
      "This monitor buying guide helped me choose the perfect display for my setup!",
    postId: { title: "Monitor Buying Guide 2024" },
    userId: { username: "tech_enthusiast" },
    numberOfLikes: 7,
    createdAt: "2024-01-11T14:30:00Z",
    updatedAt: "2024-01-11T14:30:00Z",
  },
];

export default function DashComments() {
  const { currentUser } = useSelector((state) => state.user);
  const [comments, setComments] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = fakeComments.slice(0, 5);
        setComments(data);
        setShowMore(fakeComments.length > 5);
      } catch (error) {
        console.log(error.message);
      }
    };
    if (currentUser?.isAdmin || currentUser?.user?.usertype === "Admin") {
      fetchComments();
    }
  }, [currentUser]);

  const handleShowMore = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const startIndex = comments.length;
      const newComments = fakeComments.slice(startIndex, startIndex + 3);
      setComments((prev) => [...prev, ...newComments]);
      if (startIndex + newComments.length >= fakeComments.length) {
        setShowMore(false);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDeleteComment = async () => {
    setShowModal(false);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentIdToDelete)
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {(currentUser?.isAdmin || currentUser?.user?.usertype === "Admin") &&
      comments.length > 0 ? (
        <>
          <Table hoverable className="shadow-md">
            <Table.Head>
              <Table.HeadCell>Date updated</Table.HeadCell>
              <Table.HeadCell>Comment content</Table.HeadCell>
              <Table.HeadCell>Number of likes</Table.HeadCell>
              <Table.HeadCell>PostId</Table.HeadCell>
              <Table.HeadCell>UserId</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            {comments.map((comment) => (
              <Table.Body className="divide-y" key={comment._id}>
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell>
                    {new Date(comment.updatedAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell className="max-w-xs">
                    <p className="line-clamp-2">{comment.content}</p>
                  </Table.Cell>
                  <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                  <Table.Cell>{comment.postId.title}</Table.Cell>
                  <Table.Cell>{comment.userId.username}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setCommentIdToDelete(comment._id);
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
        <p>You have no comments yet!</p>
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
              Are you sure you want to delete this comment?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDeleteComment}>
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
