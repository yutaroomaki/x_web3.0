import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">GXVIS</h1>
      <p className="text-lg text-gray-600 mb-8">
        Global X Viral Intelligence System
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/drafts"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
        >
          Drafts
        </Link>
        <Link
          href="/sources"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
        >
          Sources
        </Link>
        <Link
          href="/jobs"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
        >
          Jobs
        </Link>
        <Link
          href="/templates"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
        >
          Templates
        </Link>
      </div>
    </div>
  );
}
