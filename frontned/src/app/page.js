import Navbar from "../component/Navbar";
import FeedComponent from "../component/FeedComponent";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <FeedComponent compact={false} limit={10} />
      </div>
    </div>
  );
}
