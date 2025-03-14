import CreatePage from "@/components/create/Create";

export const metadata = {
  title: "Create Video | upload",
  description: "Create video page",
};

export default function Create() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CreatePage />
    </div>
  );
}
