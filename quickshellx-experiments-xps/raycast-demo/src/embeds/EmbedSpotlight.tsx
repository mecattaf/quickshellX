import { SpotlightLauncher } from '../ShellPage'
import EmbedWrapper from '../EmbedWrapper'

export default function EmbedSpotlight() {
  return (
    <EmbedWrapper>
      <SpotlightLauncher open={true} onClose={() => {}} />
    </EmbedWrapper>
  )
}
