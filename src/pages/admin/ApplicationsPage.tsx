import ApplicationsTable from "@/components/admin/ApplicationsTable";

const ApplicationsPage = () => {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Membership Applications</h1>
      </div>
      <div className="grid gap-4 md:gap-8">
        <ApplicationsTable />
      </div>
    </>
  );
};

export default ApplicationsPage;
