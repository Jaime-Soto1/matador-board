import React, { useState } from "react";

interface Invite {
  email: string;
  role: "viewer" | "editor";
}

const GroupManagement: React.FC = () => {
  const [boardName, setBoardName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddInvite = () => {
    if (!inviteEmail.trim()) return;
    const exists = invites.find((i) => i.email === inviteEmail.trim());
    if (exists) return alert("This email is already added.");

    setInvites((prev) => [...prev, { email: inviteEmail.trim(), role }]);
    setInviteEmail("");
    setRole("viewer");
  };

  const handleCreateBoard = async () => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return alert("You must be logged in.");
    if (!boardName.trim()) return alert("Board name is required.");

    setIsSubmitting(true);

    try {
      // 1️⃣ Validate invited users
      for (const invite of invites) {
        const res = await fetch("/api/users/by-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email }),
        });

        if (!res.ok) {
          return alert(`User not found: ${invite.email}`);
        }
      }

      // 2️⃣ Get current user ID
      const userRes = await fetch("/api/users/by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const userData = await userRes.json();
      const userId = userData?.user?.id;

      if (!userId) {
        setIsSubmitting(false);
        return alert("User not found.");
      }

      // 3️⃣ Create the board
      const boardRes = await fetch("/api/boards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName, userId }),
      });

      const boardData = await boardRes.json();

      if (!boardRes.ok || !boardData.success) {
        setIsSubmitting(false);
        return alert("Board creation failed.");
      }

      const boardId = boardData.boardId;

      // 4️⃣ Invite users
      for (const invite of invites) {
        await fetch("/api/boards/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            email: invite.email,
            role: invite.role,
          }),
        });
      }

      alert("✅ Board created and invites sent!");
      setBoardName("");
      setInvites([]);
    } catch (err) {
      console.error("❌ Error creating board:", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Create a New Group Board</h1>

      <input
        type="text"
        className="w-full p-3 mb-4 rounded bg-zinc-800 text-white border border-zinc-700"
        placeholder="Board name"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
      />

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="email"
          className="flex-1 p-3 rounded bg-zinc-800 text-white border border-zinc-700"
          placeholder="Invite email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <select
          className="p-3 rounded bg-zinc-800 text-white border border-zinc-700"
          value={role}
          onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>
        <button
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 font-semibold"
          onClick={handleAddInvite}
        >
          + Invite
        </button>
      </div>

      {invites.length > 0 && (
        <div className="bg-zinc-700 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Invited Users</h2>
          <ul className="list-disc list-inside">
            {invites.map((invite, idx) => (
              <li key={idx}>
                {invite.email} — <span className="italic">{invite.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        disabled={isSubmitting}
        onClick={handleCreateBoard}
        className={`w-full bg-blue-600 py-3 rounded font-bold ${
          isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {isSubmitting ? "Creating..." : "Create Board"}
      </button>
    </div>
  );
};

export default GroupManagement;
