/**
 * Editor Layout - Full Screen (No Navigation/Footer)
 *
 * 에디터는 전체 화면을 사용하므로 Navigation과 Footer를 제거
 */

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden">
      {children}
    </div>
  );
}
