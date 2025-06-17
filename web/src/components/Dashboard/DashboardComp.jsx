import { Button, Table } from "flowbite-react";
import React, { useEffect, useState } from "react";
import {
  HiAnnotation,
  HiArrowNarrowUp,
  HiDocumentText,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { useSelector } from "react-redux"; // check if user is admin
import { Link } from "react-router-dom";

// Fake data
const fakeUsers = [
  {
    _id: "1",
    username: "john_doe",
    email: "john@example.com",
    profilePicture: "https://via.placeholder.com/40x40?text=JD",
  },
  {
    _id: "2",
    username: "jane_smith",
    email: "jane@example.com",
    profilePicture: "https://via.placeholder.com/40x40?text=JS",
  },
  {
    _id: "3",
    username: "mike_wilson",
    email: "mike@example.com",
    profilePicture: null,
  },
  {
    _id: "4",
    username: "sarah_johnson",
    email: "sarah@example.com",
    profilePicture: "https://via.placeholder.com/40x40?text=SJ",
  },
  {
    _id: "5",
    username: "admin_user",
    email: "admin@example.com",
    profilePicture: "https://via.placeholder.com/40x40?text=AU",
  },
];

const fakePosts = [
  {
    _id: "1",
    title: "Gaming PC Build Guide 2024",
    category: "Gaming",
    image: "https://via.placeholder.com/100x60?text=PC",
    slug: "gaming-pc-2024",
  },
  {
    _id: "2",
    title: "Best Graphics Cards for Budget Gaming",
    category: "Hardware",
    image: "https://via.placeholder.com/100x60?text=GPU",
    slug: "budget-gpu-guide",
  },
  {
    _id: "3",
    title: "Office Setup Essentials",
    category: "Office",
    image: "https://via.placeholder.com/100x60?text=Office",
    slug: "office-setup",
  },
  {
    _id: "4",
    title: "RGB Lighting Tips and Tricks",
    category: "Aesthetics",
    image: "https://via.placeholder.com/100x60?text=RGB",
    slug: "rgb-lighting",
  },
  {
    _id: "5",
    title: "Monitor Buying Guide 2024",
    category: "Monitors",
    image: "https://via.placeholder.com/100x60?text=Monitor",
    slug: "monitor-guide",
  },
];

const fakeComments = [
  {
    _id: "1",
    content: "Great build guide! Very helpful for beginners.",
    userId: { username: "techfan123" },
    likes: ["1", "2", "3"],
  },
  {
    _id: "2",
    content: "Thanks for the budget GPU recommendations.",
    userId: { username: "gamer_pro" },
    likes: ["1", "2"],
  },
  {
    _id: "3",
    content: "This monitor setup looks amazing!",
    userId: { username: "setupmaster" },
    likes: ["1"],
  },
  {
    _id: "4",
    content: "RGB lighting makes all the difference.",
    userId: { username: "rgblover" },
    likes: ["1", "2", "3", "4"],
  },
  {
    _id: "5",
    content: "Office setup is clean and professional.",
    userId: { username: "workfromhome" },
    likes: ["1", "2"],
  },
];

export default function DashboardComp() {
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [lastMonthUsers, setLastMonthUsers] = useState(0);
  const [lastMonthPosts, setLastMonthPosts] = useState(0);
  const [lastMonthComments, setLastMonthComments] = useState(0);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        const data = fakeUsers.slice(0, 5);
        setUsers(data);
        setTotalUsers(fakeUsers.length);
        setLastMonthUsers(2); // Mock last month count
      } catch (error) {
        console.log(error.message);
      }
    };

    const fetchPosts = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        const data = fakePosts.slice(0, 5);
        setPosts(data);
        setTotalPosts(fakePosts.length);
        setLastMonthPosts(3); // Mock last month count
      } catch (error) {
        console.log(error.message);
      }
    };

    const fetchComments = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        const data = fakeComments.slice(0, 5);
        setComments(data);
        setTotalComments(fakeComments.length);
        setLastMonthComments(4); // Mock last month count
      } catch (error) {
        console.log(error.message);
      }
    };

    if (currentUser?.isAdmin || currentUser?.user?.usertype === "Admin") {
      fetchUsers();
      fetchPosts();
      fetchComments();
    }
  }, [currentUser]);

  return (
    <div className="p-3 md:mx-auto">
      <div className="flex-wrap flex gap-4 justify-center">
        <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
          <div className="flex justify-between">
            <div className="">
              <h3 className="text-gray-500 text-md uppercase">Total Users</h3>
              <p className="text-2xl">{totalUsers}</p>
            </div>
            <HiOutlineUserGroup className="bg-teal-600  text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
          <div className="flex  gap-2 text-sm">
            <span className="text-green-500 flex items-center">
              <HiArrowNarrowUp />
              {lastMonthUsers}
            </span>
            <div className="text-gray-500">Last month</div>
          </div>
        </div>
        <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
          <div className="flex justify-between">
            <div className="">
              <h3 className="text-gray-500 text-md uppercase">
                Total Comments
              </h3>
              <p className="text-2xl">{totalComments}</p>
            </div>
            <HiAnnotation className="bg-indigo-600  text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
          <div className="flex  gap-2 text-sm">
            <span className="text-green-500 flex items-center">
              <HiArrowNarrowUp />
              {lastMonthComments}
            </span>
            <div className="text-gray-500">Last month</div>
          </div>
        </div>
        <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
          <div className="flex justify-between">
            <div className="">
              <h3 className="text-gray-500 text-md uppercase">Total Posts</h3>
              <p className="text-2xl">{totalPosts}</p>
            </div>
            <HiDocumentText className="bg-lime-600  text-white rounded-full text-5xl p-3 shadow-lg" />
          </div>
          <div className="flex  gap-2 text-sm">
            <span className="text-green-500 flex items-center">
              <HiArrowNarrowUp />
              {lastMonthPosts}
            </span>
            <div className="text-gray-500">Last month</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 py-3 mx-auto justify-center">
        <div className="flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800">
          <div className="flex justify-between  p-3 text-sm font-semibold">
            <h1 className="text-center p-2">Recent users</h1>
            <Button outline gradientDuoTone="purpleToPink">
              <Link to={"/dashboard?tab=users"}>See all</Link>
            </Button>
          </div>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>User image</Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
            </Table.Head>
            {users &&
              users.map((user) => (
                <Table.Body key={user._id} className="divide-y">
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell>
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt="user"
                          className="w-10 h-10 rounded-full bg-gray-500"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell>{user.username}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              ))}
          </Table>
        </div>
        <div className="flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800">
          <div className="flex justify-between  p-3 text-sm font-semibold">
            <h1 className="text-center p-2">Recent comments</h1>
            <Button outline gradientDuoTone="purpleToPink">
              <Link to={"/dashboard?tab=comments"}>See all</Link>
            </Button>
          </div>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Comment content</Table.HeadCell>
              <Table.HeadCell>Likes</Table.HeadCell>
            </Table.Head>
            {comments &&
              comments.map((comment) => (
                <Table.Body key={comment._id} className="divide-y">
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="w-96">
                      <p className="line-clamp-2">{comment.content}</p>
                    </Table.Cell>
                    <Table.Cell>{comment.likes.length}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              ))}
          </Table>
        </div>
        <div className="flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800">
          <div className="flex justify-between  p-3 text-sm font-semibold">
            <h1 className="text-center p-2">Recent posts</h1>
            <Button outline gradientDuoTone="purpleToPink">
              <Link to={"/dashboard?tab=posts"}>See all</Link>
            </Button>
          </div>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Post image</Table.HeadCell>
              <Table.HeadCell>Post Title</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
            </Table.Head>
            {posts &&
              posts.map((post) => (
                <Table.Body key={post._id} className="divide-y">
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell>
                      <img
                        src={post.image}
                        alt="post"
                        className="w-14 h-10 rounded-md bg-gray-500"
                      />
                    </Table.Cell>
                    <Table.Cell className="w-96">{post.title}</Table.Cell>
                    <Table.Cell className="w-5">{post.category}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
