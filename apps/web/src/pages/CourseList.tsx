import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api.ts";
import type { Course } from "@lms/shared";

export function CourseList() {
  const query = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => apiGet<Course[]>("/courses"),
  });

  return (
    <div className="shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Courses</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      {query.isLoading && <p>Loading…</p>}
      {query.isError && <p className="error">Failed to load courses.</p>}
      {query.data && query.data.length === 0 && (
        <div className="card">
          <p className="muted">
            No courses yet. Once you create one as admin, it will appear here.
          </p>
        </div>
      )}
      {query.data?.map((course) => (
        <div key={course._id} className="card">
          <h2 style={{ margin: 0 }}>{course.title}</h2>
          <p className="muted">
            {course.difficulty} · {course.category}
          </p>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
}
