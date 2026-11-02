import API from "@/services/api";

export const getMyOrganization = async () => {
  const response = await API.get("/organizations/my-organization");

  const organization = response.data?.data?.organization;

  if (!organization?._id) {
    throw new Error("Organization information not found.");
  }

  localStorage.setItem("organizationId", organization._id);
  localStorage.setItem("organizationName", organization.name);

  return organization;
};