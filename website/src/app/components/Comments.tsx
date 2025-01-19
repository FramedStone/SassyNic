'use client'

import { useState } from 'react'

export default function Comments() {
const [comments, setComments] = useState<string[]>([])
const [newComment, setNewComment] = useState('')

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
        setComments([...comments, newComment])
        setNewComment('')
    }
}

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-3xl font-semibold mb-6 text-center">Comments</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows={4}
          placeholder="Leave a comment..."
        ></textarea>
        <button
          type="submit"
          className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Post Comment
        </button>
      </form>
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            {comment}
          </div>
        ))}
      </div>
    </div>
  )
}

