import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import { useNavigate } from "@remix-run/react";

const config = {
  clearCache: true,
  bodyType: "fullbody",
  quickStart: false,
  language: "en",
};

const style = { width: "100%", height: "100vh", border: "none" };

export default function App() {
  const navigate = useNavigate();

  const handleOnAvatarExported = (event) => {
    console.log(event.data.url);
    const avatarUrl = event.data.url;

    navigate("/home", { state: { avatarUrl } });
  };

  return (
    <AvatarCreator
      subdomain="avatar-creation-tool"
      config={config}
      style={style}
      onAvatarExported={handleOnAvatarExported}
    />
  );
}
