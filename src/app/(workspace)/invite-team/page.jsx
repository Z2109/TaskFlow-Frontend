
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, X, Check } from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

export default function InviteTeamPage() {
  const router = useRouter();

  const [members, setMembers] = useState([
    { id: 1, email: "", role: "" },
  ]);

  const [roles, setRoles] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Fetch organization roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const organizationId = localStorage.getItem("organizationId");

        if (!organizationId) {
          toast.error("Organization not found. Please log in again.");
          return;
        }

        const response = await API.get("/roles/list", {
        headers: {
          "x-organization-id": localStorage.getItem("organizationId"),
        },
      });

        const roleData =
          response.data?.roles ||
          response.data?.data?.roles ||
          response.data?.data ||
          [];

        if (!Array.isArray(roleData)) {
          throw new Error("Invalid roles response from server.");
        }

        setRoles(roleData);

      } catch (error) {
        console.error("Fetch roles error:", error);

        toast.error(
          error.response?.data?.message || "Unable to load roles."
        );
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Update member
  const updateMember = (id, field, value) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? { ...member, [field]: value }
          : member
      )
    );
  };

  // Add member
  const addMember = () => {
    if (members.length >= 20) {
      toast.error("You can invite a maximum of 20 people at once.");
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        email: "",
        role: "",
      },
    ]);
  };

  // Remove member
  const removeMember = (id) => {
    setMembers((prev) =>
      prev.filter((member) => member.id !== id)
    );
  };

  // Selected role descriptions
  const selectedRoles = members
    .map((member) =>
      roles.find((role) => role._id === member.role)
    )
    .filter(
      (role, index, array) =>
        role &&
        array.findIndex(
          (item) => item._id === role._id
        ) === index
    );

  // Submit invitations to backend
  const handleSubmit = async () => {
    try {
      const organizationId = localStorage.getItem("organizationId");

      if (!organizationId) {
        toast.error("Organization not found. Please log in again.");
        return;
      }

      if (members.length === 0) {
        toast.error("Add at least one team member.");
        return;
      }

      const invalid = members.find(
        (member) =>
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            member.email.trim()
          ) ||
          !member.role
      );

      if (invalid) {
        toast.error("Enter a valid email and select a role.");
        return;
      }

      const emails = members.map((member) =>
        member.email.trim().toLowerCase()
      );

      if (new Set(emails).size !== emails.length) {
        toast.error("Duplicate email addresses are not allowed.");
        return;
      }

      if (members.length > 20) {
        toast.error("You can send a maximum of 20 invitations.");
        return;
      }

      setLoading(true);

      const payload = {
        invitations: members.map((member) => ({
          email: member.email.trim().toLowerCase(),
          roleId: member.role,
        })),
      };

      const response = await API.post(
        "/invitations/create",
        payload,
        {
          headers: {
            "x-organization-id": organizationId,
          },
        }
      );

      const results = response.data.results || [];

      const successful = results.filter(
        (item) => item.success
      );

      const failed = results.filter(
        (item) => !item.success
      );

      if (successful.length > 0) {
        toast.success(
          `${successful.length} invitation(s) created successfully!`
        );
      }

      if (failed.length > 0) {
        failed.forEach((item) => {
          toast.error(`${item.email}: ${item.message}`);
        });

        const failedEmails = new Set(
          failed.map((item) => item.email.toLowerCase())
        );

        setMembers((prev) =>
          prev.filter((member) =>
            failedEmails.has(member.email.trim().toLowerCase())
          )
        );
      }

      if (successful.length > 0 && failed.length === 0) {
        setCompleted(true);
      }

    } catch (error) {
      console.error("Invitation submission error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to create invitations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCompleted(true);
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5fb] px-4 py-10">
      <section className="w-full max-w-[760px] rounded-[15px] border border-[#e3e5f2] bg-white px-8 py-7">

        {/* PROGRESS */}

        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[#626782]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e9eaf4] text-xs">
              1
            </span>
            Company
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              completed ? "text-[#626782]" : "font-bold text-[#191d3a]"
            }`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                completed
                  ? "bg-[#e9eaf4]"
                  : "bg-[#5145ec] text-white"
              }`}
            >
              {completed ? <Check size={15} /> : "2"}
            </span>
            Invite team
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              completed ? "font-bold text-[#191d3a]" : "text-[#626782]"
            }`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                completed
                  ? "bg-[#5145ec] text-white"
                  : "bg-[#e9eaf4]"
              }`}
            >
              3
            </span>
            Done
          </div>
        </div>

        {!completed ? (
          <>
            {/* HEADING */}

            <h1 className="text-[27px] font-bold tracking-[-0.7px] text-[#191d3a]">
              Invite your team
            </h1>

            <p className="mt-0.5 text-[13px] text-[#626b91]">
              Choose a role for each person. You can change roles any time.
            </p>

            {/* INVITATION ROWS */}

            <div className="mt-4 space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)_20px] sm:gap-3"
                >
                  {/* EMAIL */}

                  <div className="flex h-11 min-w-0 items-center gap-2.5 rounded-[11px] border border-[#cfd3e9] px-3 focus-within:border-[#5145ec]">
                    <Mail
                      size={16}
                      className="shrink-0 text-[#566087]"
                    />

                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) =>
                        updateMember(
                          member.id,
                          "email",
                          e.target.value
                        )
                      }
                      placeholder="Enter email address"
                      disabled={loading}
                      className="w-full min-w-0 bg-transparent text-[14px] text-[#566087] outline-none"
                    />
                  </div>

                  {/* ROLE */}

                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateMember(
                        member.id,
                        "role",
                        e.target.value
                      )
                    }
                    disabled={loadingRoles || loading}
                    className="h-11 w-full min-w-0 rounded-[11px] border border-[#cfd3e9] bg-white px-3 text-[14px] text-[#566087] outline-none focus:border-[#5145ec]"
                  >
                    <option value="">
                      {loadingRoles ? "Loading roles..." : "Select role"}
                    </option>

                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    disabled={loading}
                    className="flex h-7 w-7 items-center justify-center justify-self-end text-[#191d3a] hover:text-red-500 disabled:opacity-50"
                    aria-label="Remove member"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* ADD PERSON */}

            <button
              type="button"
              onClick={addMember}
              disabled={loading}
              className="mt-3 text-[13px] font-medium text-[#626b91] hover:text-[#5145ec]"
            >
              + Add another person
            </button>

            {/* ROLE DESCRIPTION */}

            <div className="mt-3 rounded-[13px] bg-[#f4f4fa] px-3.5 py-3">
              <h3 className="text-[14px] font-bold text-[#191d3a]">
                What each role can do
              </h3>

              <p className="mt-0.5 text-[13px] leading-[17px] text-[#626b91]">
                {selectedRoles.length > 0
                  ? selectedRoles
                      .map(
                        (role) =>
                          `${role.name}: ${role.description || "No description available."}`
                      )
                      .join(" ")
                  : "Select a role to see what each team member can do."}
              </p>
            </div>

            {/* ACTIONS */}

            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="text-[14px] font-medium text-[#5145ec] underline underline-offset-2"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || loadingRoles || roles.length === 0}
                className="rounded-[11px] bg-[#5145ec] px-[19px] py-[12px] text-[14px] font-semibold text-white transition hover:bg-[#4035d4] disabled:opacity-60"
              >
                {loading
                  ? "Sending..."
                  : `Send ${members.length} invites`}
              </button>
            </div>
          </>
        ) : (
          /* DONE SCREEN */

          <div className="py-12 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#eeedff]">
              <Check size={30} className="text-[#5145ec]" />
            </div>

            <h1 className="text-[27px] font-bold text-[#191d3a]">
              You're all set!
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#626b91]">
              Your workspace is ready. You can now start
              managing projects and collaborating with your team.
            </p>

            <button
              onClick={handleFinish}
              className="mt-7 rounded-[11px] bg-[#5145ec] px-7 py-3 text-sm font-semibold text-white hover:bg-[#4035d4]"
            >
              Go to dashboard
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
