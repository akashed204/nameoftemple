import MembersTable from "@/components/admin/MembersTable";

const MembersPage = () => {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Members</h1>
      </div>
      <div className="grid gap-4 md:gap-8">
        <MembersTable />
      </div>
    </>
  );
};

export default MembersPage;
