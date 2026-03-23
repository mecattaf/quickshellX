import { createSignal, onCleanup, onMount, Show } from "solid-js";
import "./App.css";

declare global {
  interface Window {
    qt?: { webChannelTransport: any };
    QWebChannel?: any;
  }
}

function App() {
  const [time, setTime] = createSignal(new Date());
  const [connected, setConnected] = createSignal(false);
  const [volume, setVolume] = createSignal<number | null>(null);

  // Clock
  const timer = setInterval(() => setTime(new Date()), 1000);
  onCleanup(() => clearInterval(timer));

  // Try connecting to WebChannel (only works inside QuickshellX WebEngineView)
  onMount(() => {
    if (!window.qt?.webChannelTransport || !window.QWebChannel) return;
    new window.QWebChannel(window.qt.webChannelTransport, (channel: any) => {
      setConnected(true);
      const audio = channel.objects.audio;
      if (audio?.defaultAudioSink) {
        setVolume(Math.round(audio.defaultAudioSink.audio.volume * 100));
        audio.defaultAudioSink.audio.volumeChanged.connect(() => {
          setVolume(Math.round(audio.defaultAudioSink.audio.volume * 100));
        });
      }
    });
  });

  const hours = () => time().getHours().toString().padStart(2, "0");
  const minutes = () => time().getMinutes().toString().padStart(2, "0");
  const seconds = () => time().getSeconds().toString().padStart(2, "0");
  const dateStr = () =>
    time().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <div class="widget">
      <div class="clock">
        <span class="h">{hours()}</span>
        <span class="sep">:</span>
        <span class="m">{minutes()}</span>
        <span class="sep dim">:</span>
        <span class="s dim">{seconds()}</span>
      </div>
      <div class="date">{dateStr()}</div>

      <div class="status-bar">
        <Show
          when={connected()}
          fallback={<span class="badge standalone">standalone</span>}
        >
          <span class="badge connected">quickshell</span>
        </Show>
        <Show when={volume() !== null}>
          <span class="badge vol">vol {volume()}%</span>
        </Show>
      </div>
    </div>
  );
}

export default App;
