import { Organization } from '../models/Organization';

export const getUserOrganizationIds = async (user: any) => {
  const explicitIds = [
    ...(Array.isArray(user.organizationIds) ? user.organizationIds : []),
    ...(user.organizationId ? [user.organizationId] : []),
  ].map((id: any) => id.toString());

  const ownedOrganizations = await Organization.find({ ownerId: user._id }).select('_id');
  const ownedIds = ownedOrganizations.map((organization) => organization._id.toString());

  return Array.from(new Set([...explicitIds, ...ownedIds]));
};

export const getAccessibleOrganizations = async (user: any) => {
  const organizationIds = await getUserOrganizationIds(user);

  return Organization.find({
    $or: [{ ownerId: user._id }, { _id: { $in: organizationIds } }],
  }).sort({ createdAt: -1 });
};

export const syncUserOrganizations = async (user: any) => {
  const organizationIds = await getUserOrganizationIds(user);
  user.organizationIds = organizationIds;

  if (!user.organizationId && organizationIds.length > 0) {
    user.organizationId = organizationIds[0];
  }

  await user.save();
  return organizationIds;
};
