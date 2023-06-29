interface TitleContentProps {
  content?: string;
  title: string;
}
function TitleContent({ content, title }: TitleContentProps) {
  return (
    <div>
      <p className="text-sm text-gray-500"> {title}</p>
      <p className="overflow-auto"> {content}</p>
    </div>
  );
}

export default TitleContent;
