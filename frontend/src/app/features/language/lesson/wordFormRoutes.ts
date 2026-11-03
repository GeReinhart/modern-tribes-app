// Lessons have no feature_instance_id of their own (a project's lessons are shared by every
// language_lesson/learn/test tab instance), so the tab to return to must be carried explicitly
// as a route segment, exactly like the project page's own `:tab` (= feature_instance_id) route.
export function lessonTabPath(tribeId: string, projectId: string, featureInstanceId: string, lessonId: string): string {
  return `/app/tribes/${tribeId}/projects/${projectId}/${featureInstanceId}?lessonId=${lessonId}`;
}

export function addWordPath(tribeId: string, projectId: string, featureInstanceId: string, lessonId: string): string {
  return `/app/tribes/${tribeId}/projects/${projectId}/${featureInstanceId}/language-lessons/${lessonId}/words/new`;
}

export function editWordPath(
  tribeId: string, projectId: string, featureInstanceId: string, lessonId: string, wordId: string,
): string {
  return `/app/tribes/${tribeId}/projects/${projectId}/${featureInstanceId}/language-lessons/${lessonId}/words/${wordId}/edit`;
}
