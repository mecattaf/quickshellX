import { TopBar } from '../ShellPage'
import EmbedWrapper from '../EmbedWrapper'

export default function EmbedTopBar() {
  return (
    <EmbedWrapper rootClass="embed-topbar">
      <TopBar onWifiClick={() => {}} onSearchClick={() => {}} />
    </EmbedWrapper>
  )
}
