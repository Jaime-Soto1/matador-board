import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Board {
  id: number;
  name: string;
  created_at: string;
  members?: Member[];
}

interface Member {
  email: string;
  permission: "viewer" | "editor";
}

const MyBoards: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
      const email = localStorage.getItem("userEmail");
      setUserEmail(email);
      if (!email) return;

      try {
        const res = await fetch("/api/users/by-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        const userId = data?.user?.id;
        if (!userId) return;

        const boardRes = await fetch(`/api/boards?userId=${userId}`);
        const boardData = await boardRes.json();
        const boardsWithMembers: Board[] = [];

        for (const board of boardData.boards ?? []) {
          const memberRes = await fetch(`/api/boards/${board.id}/members`);
          const memberData = await memberRes.json();
          boardsWithMembers.push({ ...board, members: memberData.members });
        }

        setBoards(boardsWithMembers);
      } catch (err) {
        console.error("Error loading boards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  return (
    <div className="w-full max-w-[100rem] mx-auto py-10 px-6 text-white">
      <h1 className="text-3xl font-bold mb-8">My Boards</h1>

      {loading ? (
        <p>Loading boards...</p>
      ) : boards.length === 0 ? (
        <p>You’re not a part of any boards yet.</p>
      ) : (
        <div className="flex items-start gap-6 overflow-x-auto pb-12">
          {boards.map((board) => (
            <div
              key={board.id}
              className="min-w-[300px] bg-zinc-800 rounded-xl shadow-md p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold truncate">{board.name}</h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  Open
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-3">
                Created: {new Date(board.created_at).toLocaleString()}
              </p>

              {board.members && (
                <div>
                  <p className="text-sm font-semibold mb-1">Members:</p>
                  <ul className="text-sm space-y-1">
                    {board.members.map((m, idx) => (
                      <li key={idx}>
                        {m.email}{" "}
                        {m.email === userEmail ? (
                          <span className="italic text-green-400">
                            (You - {m.permission})
                          </span>
                        ) : (
                          <span className="italic text-gray-400">
                            ({m.permission})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBoards;
