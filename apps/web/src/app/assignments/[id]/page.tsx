import AssignmentDetailClient from "@/components/AssignmentDetailClient";
import { API_BASE_URL } from "@/lib/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return (
        <AssignmentDetailClient
          assignmentId={id}
          initialError="Assignment not found."
        />
      );
    }

    const data = await response.json();

    return (
      <AssignmentDetailClient
        assignmentId={id}
        initialAssignment={data.assignment}
        initialGeneration={data.generation ?? undefined}
      />
    );
  } catch {
    return (
      <AssignmentDetailClient
        assignmentId={id}
        initialError="Unable to load assignment."
      />
    );
  }
}
