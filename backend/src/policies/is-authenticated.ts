export default async (policyContext: any) => {
  if (!policyContext.state?.user) {
    return false;
  }
  return true;
};
