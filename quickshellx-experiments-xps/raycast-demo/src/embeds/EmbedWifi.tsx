import { WifiMenu } from '../ShellPage'
import EmbedWrapper from '../EmbedWrapper'

export default function EmbedWifi() {
  return (
    <EmbedWrapper>
      <WifiMenu open={true} onClose={() => {}} />
    </EmbedWrapper>
  )
}
