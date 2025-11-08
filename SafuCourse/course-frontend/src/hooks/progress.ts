export async function getProgress(address: string, courseId: number) {
  const response = await fetch(`${
      import.meta.env.VITE_API_URL
    }progress/${address}/${courseId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  const data = await response.json();
  return data;
}

export async function updateProgress(
  address: string,
  courseId: number,
  lessonIndex: number
) {
  await fetch(`${import.meta.env.VITE_API_URL}progress/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_API_KEY,
    },
    body: JSON.stringify({
      userId: address,
      courseId,
      lessonIndex
    }),
  });
}
