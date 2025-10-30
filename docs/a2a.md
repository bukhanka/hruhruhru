| **Note:** Introducing a [new version of the Gemini 2.5 Flash Live model](https://x.com/GoogleAIStudio/status/1970545734736023564), with improved function calling and conversational accuracy

The Live API enables low-latency, real-time voice and video interactions with
Gemini. It processes continuous streams of audio, video, or text to deliver
immediate, human-like spoken responses, creating a natural conversational
experience for your users.

![Live API Overview](https://ai.google.dev/static/gemini-api/docs/images/live-api-overview.png)

Live API offers a comprehensive set of features such as [Voice Activity Detection](https://ai.google.dev/gemini-api/docs/live-guide#interruptions), [tool use and function calling](https://ai.google.dev/gemini-api/docs/live-tools), [session management](https://ai.google.dev/gemini-api/docs/live-session) (for managing long running conversations) and [ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) (for secure client-sided authentication).

This page gets you up and running with examples and basic code samples.

[Try the Live API in Google AI Studiomic](https://aistudio.google.com/live)

## Example applications

Check out the following example applications that illustrate how to use Live API
for end-to-end use cases:

- [Live audio starter app](https://aistudio.google.com/apps/bundled/live_audio?showPreview=true&showCode=true&showAssistant=false) on AI Studio, using JavaScript libraries to connect to Live API and stream bidirectional audio through your microphone and speakers.
- Live API [Python cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.ipynb) using Pyaudio that connects to Live API.

## Partner integrations

If you prefer a simpler development process, you can use [Daily](https://www.daily.co/products/gemini/multimodal-live-api/), [LiveKit](https://docs.livekit.io/agents/integrations/google/#multimodal-live-api) or [Voximplant](https://voximplant.com/products/gemini-client). These are third-party partner platforms that have already integrated the Gemini Live API over the WebRTC protocol to streamline the development of real-time audio and video applications.

## Before you begin building

There are two important decisions to make before you begin building with the
Live API: choosing a model and choosing an implementation
approach.

### Choose an audio generation architecture

If you're building an audio-based use case, your choice of model determines the
audio generation architecture used to create the audio response:

- **[Native audio](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output):** This option provides the most natural and realistic-sounding speech and better multilingual performance. It also enables advanced features like [affective (emotion-aware) dialogue](https://ai.google.dev/gemini-api/docs/live-guide#affective-dialog), [proactive audio](https://ai.google.dev/gemini-api/docs/live-guide#proactive-audio) (where the model can decide to ignore or respond to certain inputs), and ["thinking"](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output-thinking). Native audio is supported by the following [native audio models](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-native-audio):
  - `gemini-2.5-flash-native-audio-preview-09-2025`
- **Half-cascade audio** : This option uses a cascaded model architecture (native audio input and text-to-speech output). It offers better performance and reliability in production environments, especially with [tool use](https://ai.google.dev/gemini-api/docs/live-tools). Half-cascaded audio is supported by the following models:
  - `gemini-live-2.5-flash-preview`
  - `gemini-2.0-flash-live-001`

### Choose an implementation approach

When integrating with Live API, you'll need to choose one of the following
implementation approaches:

- **Server-to-server** : Your backend connects to the Live API using [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API). Typically, your client sends stream data (audio, video, text) to your server, which then forwards it to the Live API.
- **Client-to-server** : Your frontend code connects directly to the Live API using [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to stream data, bypassing your backend.

| **Note:** Client-to-server generally offers better performance for streaming audio and video, since it bypasses the need to send the stream to your backend first. It's also easier to set up since you don't need to implement a proxy that sends data from your client to your server and then your server to the API. However, for production environments, in order to mitigate security risks, we recommend using [ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) instead of standard API keys.

## Get started

This example ***reads a WAV file***, sends it in the correct format, and saves
the received data as WAV file.

You can send audio by converting it to 16-bit PCM, 16kHz, mono format, and you
can receive audio by setting `AUDIO` as response modality. The output uses a
sample rate of 24kHz.  

### Python

    # Test file: https://storage.googleapis.com/generativeai-downloads/data/16000.wav
    # Install helpers for converting files: pip install librosa soundfile
    import asyncio
    import io
    from pathlib import Path
    import wave
    from google import genai
    from google.genai import types
    import soundfile as sf
    import librosa

    client = genai.Client()

    # New native audio model:
    model = "gemini-2.5-flash-native-audio-preview-09-2025"

    config = {
      "response_modalities": ["AUDIO"],
      "system_instruction": "You are a helpful assistant and answer in a friendly tone.",
    }

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:

            buffer = io.BytesIO()
            y, sr = librosa.load("sample.wav", sr=16000)
            sf.write(buffer, y, sr, format='RAW', subtype='PCM_16')
            buffer.seek(0)
            audio_bytes = buffer.read()

            # If already in correct format, you can use this:
            # audio_bytes = Path("sample.pcm").read_bytes()

            await session.send_realtime_input(
                audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
            )

            wf = wave.open("audio.wav", "wb")
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)  # Output is 24kHz

            async for response in session.receive():
                if response.data is not None:
                    wf.writeframes(response.data)

                # Un-comment this code to print audio data info
                # if response.server_content.model_turn is not None:
                #      print(response.server_content.model_turn.parts[0].inline_data.mime_type)

            wf.close()

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    // Test file: https://storage.googleapis.com/generativeai-downloads/data/16000.wav
    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';  // npm install wavefile
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    // WARNING: Do not use API keys in client-side (browser based) applications
    // Consider using Ephemeral Tokens instead
    // More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

    // New native audio model:
    const model = "gemini-2.5-flash-native-audio-preview-09-2025"

    const config = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are a helpful assistant and answer in a friendly tone."
    };

    async function live() {
        const responseQueue = [];

        async function waitMessage() {
            let done = false;
            let message = undefined;
            while (!done) {
                message = responseQueue.shift();
                if (message) {
                    done = true;
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }
            return message;
        }

        async function handleTurn() {
            const turns = [];
            let done = false;
            while (!done) {
                const message = await waitMessage();
                turns.push(message);
                if (message.serverContent && message.serverContent.turnComplete) {
                    done = true;
                }
            }
            return turns;
        }

        const session = await ai.live.connect({
            model: model,
            callbacks: {
                onopen: function () {
                    console.debug('Opened');
                },
                onmessage: function (message) {
                    responseQueue.push(message);
                },
                onerror: function (e) {
                    console.debug('Error:', e.message);
                },
                onclose: function (e) {
                    console.debug('Close:', e.reason);
                },
            },
            config: config,
        });

        // Send Audio Chunk
        const fileBuffer = fs.readFileSync("sample.wav");

        // Ensure audio conforms to API requirements (16-bit PCM, 16kHz, mono)
        const wav = new WaveFile();
        wav.fromBuffer(fileBuffer);
        wav.toSampleRate(16000);
        wav.toBitDepth("16");
        const base64Audio = wav.toBase64();

        // If already in correct format, you can use this:
        // const fileBuffer = fs.readFileSync("sample.pcm");
        // const base64Audio = Buffer.from(fileBuffer).toString('base64');

        session.sendRealtimeInput(
            {
                audio: {
                    data: base64Audio,
                    mimeType: "audio/pcm;rate=16000"
                }
            }

        );

        const turns = await handleTurn();

        // Combine audio data strings and save as wave file
        const combinedAudio = turns.reduce((acc, turn) => {
            if (turn.data) {
                const buffer = Buffer.from(turn.data, 'base64');
                const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
                return acc.concat(Array.from(intArray));
            }
            return acc;
        }, []);

        const audioBuffer = new Int16Array(combinedAudio);

        const wf = new WaveFile();
        wf.fromScratch(1, 24000, '16', audioBuffer);  // output is 24kHz
        fs.writeFileSync('audio.wav', wf.toBuffer());

        session.close();
    }

    async function main() {
        await live().catch((e) => console.error('got error', e));
    }

    main();

## What's next

- Read the full Live API [Capabilities](https://ai.google.dev/gemini-api/docs/live-guide) guide for key capabilities and configurations; including Voice Activity Detection and native audio features.
- Read the [Tool use](https://ai.google.dev/gemini-api/docs/live-tools) guide to learn how to integrate Live API with tools and function calling.
- Read the [Session management](https://ai.google.dev/gemini-api/docs/live-session) guide for managing long running conversations.
- Read the [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) guide for secure authentication in [client-to-server](https://ai.google.dev/gemini-api/docs/live#implementation-approach) applications.
- For more information about the underlying WebSockets API, see the [WebSockets API reference](https://ai.google.dev/api/live).


<br />

| **Preview:** The Live API is in preview.

This is a comprehensive guide that covers capabilities and configurations
available with the Live API.
See [Get started with Live API](https://ai.google.dev/gemini-api/docs/live) page for a
overview and sample code for common use cases.

## Before you begin

- **Familiarize yourself with core concepts:** If you haven't already done so, read the [Get started with Live API](https://ai.google.dev/gemini-api/docs/live) page first. This will introduce you to the fundamental principles of the Live API, how it works, and the distinction between the [different models](https://ai.google.dev/gemini-api/docs/live#audio-generation) and their corresponding audio generation methods ([native audio](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output) or half-cascade).
- **Try the Live API in AI Studio:** You may find it useful to try the Live API in [Google AI Studio](https://aistudio.google.com/app/live) before you start building. To use the Live API in Google AI Studio, select **Stream**.

## Establishing a connection

The following example shows how to create a connection with an API key:  

### Python

    import asyncio
    from google import genai

    client = genai.Client()

    model = "gemini-live-2.5-flash-preview"
    config = {"response_modalities": ["TEXT"]}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            print("Session started")

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';
    const config = { responseModalities: [Modality.TEXT] };

    async function main() {

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            console.debug(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      // Send content...

      session.close();
    }

    main();

| **Note:** You can only set [one modality](https://ai.google.dev/gemini-api/docs/live#response-modalities) in the `response_modalities` field. This means that you can configure the model to respond with either text or audio, but not both in the same session.

## Interaction modalities

The following sections provide examples and supporting context for the different
input and output modalities available in Live API.

### Sending and receiving text

Here's how you can send and receive text:  

### Python

    import asyncio
    from google import genai

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {"response_modalities": ["TEXT"]}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            message = "Hello, how are you?"
            await session.send_client_content(
                turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
            )

            async for response in session.receive():
                if response.text is not None:
                    print(response.text, end="")

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';
    const config = { responseModalities: [Modality.TEXT] };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      const inputTurns = 'Hello how are you?';
      session.sendClientContent({ turns: inputTurns });

      const turns = await handleTurn();
      for (const turn of turns) {
        if (turn.text) {
          console.debug('Received text: %s\n', turn.text);
        }
        else if (turn.data) {
          console.debug('Received inline data: %s\n', turn.data);
        }
      }

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

#### Incremental content updates

Use incremental updates to send text input, establish session context, or
restore session context. For short contexts you can send turn-by-turn
interactions to represent the exact sequence of events:  

### Python

    turns = [
        {"role": "user", "parts": [{"text": "What is the capital of France?"}]},
        {"role": "model", "parts": [{"text": "Paris"}]},
    ]

    await session.send_client_content(turns=turns, turn_complete=False)

    turns = [{"role": "user", "parts": [{"text": "What is the capital of Germany?"}]}]

    await session.send_client_content(turns=turns, turn_complete=True)

### JavaScript

    let inputTurns = [
      { "role": "user", "parts": [{ "text": "What is the capital of France?" }] },
      { "role": "model", "parts": [{ "text": "Paris" }] },
    ]

    session.sendClientContent({ turns: inputTurns, turnComplete: false })

    inputTurns = [{ "role": "user", "parts": [{ "text": "What is the capital of Germany?" }] }]

    session.sendClientContent({ turns: inputTurns, turnComplete: true })

For longer contexts it's recommended to provide a single message summary to free
up the context window for subsequent interactions. See [Session Resumption](https://ai.google.dev/gemini-api/docs/live-session#session-resumption) for another method for
loading session context.

### Sending and receiving audio

The most common audio example, **audio-to-audio** , is covered in the
[Getting started](https://ai.google.dev/gemini-api/docs/live#audio-to-audio) guide.

Here's an **audio-to-text** example that reads a WAV file, sends it in the
correct format and receives text output:  

### Python

    # Test file: https://storage.googleapis.com/generativeai-downloads/data/16000.wav
    # Install helpers for converting files: pip install librosa soundfile
    import asyncio
    import io
    from pathlib import Path
    from google import genai
    from google.genai import types
    import soundfile as sf
    import librosa

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {"response_modalities": ["TEXT"]}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:

            buffer = io.BytesIO()
            y, sr = librosa.load("sample.wav", sr=16000)
            sf.write(buffer, y, sr, format='RAW', subtype='PCM_16')
            buffer.seek(0)
            audio_bytes = buffer.read()

            # If already in correct format, you can use this:
            # audio_bytes = Path("sample.pcm").read_bytes()

            await session.send_realtime_input(
                audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
            )

            async for response in session.receive():
                if response.text is not None:
                    print(response.text)

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    // Test file: https://storage.googleapis.com/generativeai-downloads/data/16000.wav
    // Install helpers for converting files: npm install wavefile
    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';
    const config = { responseModalities: [Modality.TEXT] };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      // Send Audio Chunk
      const fileBuffer = fs.readFileSync("sample.wav");

      // Ensure audio conforms to API requirements (16-bit PCM, 16kHz, mono)
      const wav = new WaveFile();
      wav.fromBuffer(fileBuffer);
      wav.toSampleRate(16000);
      wav.toBitDepth("16");
      const base64Audio = wav.toBase64();

      // If already in correct format, you can use this:
      // const fileBuffer = fs.readFileSync("sample.pcm");
      // const base64Audio = Buffer.from(fileBuffer).toString('base64');

      session.sendRealtimeInput(
        {
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000"
          }
        }

      );

      const turns = await handleTurn();
      for (const turn of turns) {
        if (turn.text) {
          console.debug('Received text: %s\n', turn.text);
        }
        else if (turn.data) {
          console.debug('Received inline data: %s\n', turn.data);
        }
      }

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

And here is a **text-to-audio** example.
You can receive audio by setting `AUDIO` as response modality. This example
saves the received data as WAV file:  

### Python

    import asyncio
    import wave
    from google import genai

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {"response_modalities": ["AUDIO"]}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            wf = wave.open("audio.wav", "wb")
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)

            message = "Hello how are you?"
            await session.send_client_content(
                turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
            )

            async for response in session.receive():
                if response.data is not None:
                    wf.writeframes(response.data)

                # Un-comment this code to print audio data info
                # if response.server_content.model_turn is not None:
                #      print(response.server_content.model_turn.parts[0].inline_data.mime_type)

            wf.close()

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';
    const config = { responseModalities: [Modality.AUDIO] };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      const inputTurns = 'Hello how are you?';
      session.sendClientContent({ turns: inputTurns });

      const turns = await handleTurn();

      // Combine audio data strings and save as wave file
      const combinedAudio = turns.reduce((acc, turn) => {
        if (turn.data) {
          const buffer = Buffer.from(turn.data, 'base64');
          const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
          return acc.concat(Array.from(intArray));
        }
        return acc;
      }, []);

      const audioBuffer = new Int16Array(combinedAudio);

      const wf = new WaveFile();
      wf.fromScratch(1, 24000, '16', audioBuffer);
      fs.writeFileSync('output.wav', wf.toBuffer());

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

#### Audio formats

Audio data in the Live API is always raw, little-endian,
16-bit PCM. Audio output always uses a sample rate of 24kHz. Input audio
is natively 16kHz, but the Live API will resample if needed
so any sample rate can be sent. To convey the sample rate of input audio, set
the MIME type of each audio-containing [Blob](https://ai.google.dev/api/caching#Blob) to a value
like `audio/pcm;rate=16000`.

#### Audio transcriptions

You can enable transcription of the model's audio output by sending
`output_audio_transcription` in the setup config. The transcription language is
inferred from the model's response.  

### Python

    import asyncio
    from google import genai
    from google.genai import types

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {"response_modalities": ["AUDIO"],
            "output_audio_transcription": {}
    }

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            message = "Hello? Gemini are you there?"

            await session.send_client_content(
                turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
            )

            async for response in session.receive():
                if response.server_content.model_turn:
                    print("Model turn:", response.server_content.model_turn)
                if response.server_content.output_transcription:
                    print("Transcript:", response.server_content.output_transcription.text)

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';

    const config = {
      responseModalities: [Modality.AUDIO],
      outputAudioTranscription: {}
    };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      const inputTurns = 'Hello how are you?';
      session.sendClientContent({ turns: inputTurns });

      const turns = await handleTurn();

      for (const turn of turns) {
        if (turn.serverContent && turn.serverContent.outputTranscription) {
          console.debug('Received output transcription: %s\n', turn.serverContent.outputTranscription.text);
        }
      }

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

You can enable transcription of the audio input by sending
`input_audio_transcription` in setup config.  

### Python

    import asyncio
    from pathlib import Path
    from google import genai
    from google.genai import types

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {
        "response_modalities": ["TEXT"],
        "input_audio_transcription": {},
    }

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            audio_data = Path("16000.pcm").read_bytes()

            await session.send_realtime_input(
                audio=types.Blob(data=audio_data, mime_type='audio/pcm;rate=16000')
            )

            async for msg in session.receive():
                if msg.server_content.input_transcription:
                    print('Transcript:', msg.server_content.input_transcription.text)

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";
    import pkg from 'wavefile';
    const { WaveFile } = pkg;

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';

    const config = {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: {}
    };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      // Send Audio Chunk
      const fileBuffer = fs.readFileSync("16000.wav");

      // Ensure audio conforms to API requirements (16-bit PCM, 16kHz, mono)
      const wav = new WaveFile();
      wav.fromBuffer(fileBuffer);
      wav.toSampleRate(16000);
      wav.toBitDepth("16");
      const base64Audio = wav.toBase64();

      // If already in correct format, you can use this:
      // const fileBuffer = fs.readFileSync("sample.pcm");
      // const base64Audio = Buffer.from(fileBuffer).toString('base64');

      session.sendRealtimeInput(
        {
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000"
          }
        }
      );

      const turns = await handleTurn();

      for (const turn of turns) {
        if (turn.serverContent && turn.serverContent.outputTranscription) {
          console.log("Transcription")
          console.log(turn.serverContent.outputTranscription.text);
        }
      }
      for (const turn of turns) {
        if (turn.text) {
          console.debug('Received text: %s\n', turn.text);
        }
        else if (turn.data) {
          console.debug('Received inline data: %s\n', turn.data);
        }
        else if (turn.serverContent && turn.serverContent.inputTranscription) {
          console.debug('Received input transcription: %s\n', turn.serverContent.inputTranscription.text);
        }
      }

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

### Stream audio and video

| To see an example of how to use
| the Live API in a streaming audio and video format,
| run the "Live API - Get Started" file in the cookbooks repository:
|
|
| [View
| on Colab](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.py)

### Change voice and language

The Live API models each support a different set of voices.
Half-cascade supports Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, and Zephyr.
Native audio supports a much longer list (identical to
[the TTS model list](https://ai.google.dev/gemini-api/docs/speech-generation#voices)). You can listen
to all the voices in [AI Studio](https://aistudio.google.com/app/live).

To specify a voice, set the voice name within the `speechConfig` object as part
of the session configuration:  

### Python

    config = {
        "response_modalities": ["AUDIO"],
        "speech_config": {
            "voice_config": {"prebuilt_voice_config": {"voice_name": "Kore"}}
        },
    }

### JavaScript

    const config = {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
    };

| **Note:** If you're using the `generateContent` API, the set of available voices is slightly different. See the [audio generation guide](https://ai.google.dev/gemini-api/docs/audio-generation#voices) for `generateContent` audio generation voices.

The Live API supports [multiple languages](https://ai.google.dev/gemini-api/docs/live-guide#supported-languages).

To change the language, set the language code within the `speechConfig` object
as part of the session configuration:  

### Python

    config = {
        "response_modalities": ["AUDIO"],
        "speech_config": {
            "language_code": "de-DE"
        }
    }

### JavaScript

    const config = {
      responseModalities: [Modality.AUDIO],
      speechConfig: { languageCode: "de-DE" }
    };

| **Note:** [Native audio output](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output) models automatically choose the appropriate language and don't support explicitly setting the language code.

## Native audio capabilities

The following capabilities are only available with native audio. You can learn
more about native audio in
[Choose a model and audio generation](https://ai.google.dev/gemini-api/docs/live#audio-generation).
| **Note:** Native audio models currently have limited tool use support. See [Overview of supported tools](https://ai.google.dev/gemini-api/docs/live-tools#tools-overview) for details.

### How to use native audio output

To use native audio output, configure one of the
[native audio models](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-native-audio)
and set `response_modalities` to `AUDIO`.

See [Send and receive audio](https://ai.google.dev/gemini-api/docs/live#audio-to-audio) for
a full example.  

### Python

    model = "gemini-2.5-flash-native-audio-preview-09-2025"
    config = types.LiveConnectConfig(response_modalities=["AUDIO"])

    async with client.aio.live.connect(model=model, config=config) as session:
        # Send audio input and receive audio

### JavaScript

    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
    const config = { responseModalities: [Modality.AUDIO] };

    async function main() {

      const session = await ai.live.connect({
        model: model,
        config: config,
        callbacks: ...,
      });

      // Send audio input and receive audio

      session.close();
    }

    main();

### Affective dialog

This feature lets Gemini adapt its response style to the input expression and
tone.

To use affective dialog, set the api version to `v1alpha` and set
`enable_affective_dialog` to `true`in the setup message:  

### Python

    client = genai.Client(http_options={"api_version": "v1alpha"})

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        enable_affective_dialog=True
    )

### JavaScript

    const ai = new GoogleGenAI({ httpOptions: {"apiVersion": "v1alpha"} });

    const config = {
      responseModalities: [Modality.AUDIO],
      enableAffectiveDialog: true
    };

Note that affective dialog is currently only supported by the native audio
output models.

### Proactive audio

When this feature is enabled, Gemini can proactively decide not to respond
if the content is not relevant.

To use it, set the api version to `v1alpha` and configure the `proactivity`
field in the setup message and set `proactive_audio` to `true`:  

### Python

    client = genai.Client(http_options={"api_version": "v1alpha"})

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        proactivity={'proactive_audio': True}
    )

### JavaScript

    const ai = new GoogleGenAI({ httpOptions: {"apiVersion": "v1alpha"} });

    const config = {
      responseModalities: [Modality.AUDIO],
      proactivity: { proactiveAudio: true }
    }

Note that proactive audio is currently only supported by the native audio output
models.

### Thinking

The latest native audio output model `gemini-2.5-flash-native-audio-preview-09-2025`
supports [thinking capabilities](https://ai.google.dev/gemini-api/docs/thinking), with dynamic
thinking enabled by default.

The `thinkingBudget` parameter guides the model on the number of thinking tokens
to use when generating a response. You can disable thinking by setting
`thinkingBudget` to `0`. For more info on the `thinkingBudget` configuration
details of the model, see the [thinking budgets documentation](https://ai.google.dev/gemini-api/docs/thinking#set-budget).  

### Python

    model = "gemini-2.5-flash-native-audio-preview-09-2025"

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"]
        thinking_config=types.ThinkingConfig(
            thinking_budget=1024,
        )
    )

    async with client.aio.live.connect(model=model, config=config) as session:
        # Send audio input and receive audio

### JavaScript

    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
    const config = {
      responseModalities: [Modality.AUDIO],
      thinkingConfig: {
        thinkingBudget: 1024,
      },
    };

    async function main() {

      const session = await ai.live.connect({
        model: model,
        config: config,
        callbacks: ...,
      });

      // Send audio input and receive audio

      session.close();
    }

    main();

Additionally, you can enable thought summaries by setting `includeThoughts` to
`true` in your configuration. See [thought summaries](https://ai.google.dev/gemini-api/docs/thinking#summaries)
for more info:  

### Python

    model = "gemini-2.5-flash-native-audio-preview-09-2025"

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"]
        thinking_config=types.ThinkingConfig(
            thinking_budget=1024,
            include_thoughts=True
        )
    )

### JavaScript

    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
    const config = {
      responseModalities: [Modality.AUDIO],
      thinkingConfig: {
        thinkingBudget: 1024,
        includeThoughts: true,
      },
    };

## Voice Activity Detection (VAD)

Voice Activity Detection (VAD) allows the model to recognize when a person is
speaking. This is essential for creating natural conversations, as it allows a
user to interrupt the model at any time.

When VAD detects an interruption, the ongoing generation is canceled and
discarded. Only the information already sent to the client is retained in the
session history. The server then sends a [`BidiGenerateContentServerContent`](https://ai.google.dev/api/live#bidigeneratecontentservercontent) message to report the interruption.

The Gemini server then discards any pending function calls and sends a
`BidiGenerateContentServerContent` message with the IDs of the canceled calls.  

### Python

    async for response in session.receive():
        if response.server_content.interrupted is True:
            # The generation was interrupted

            # If realtime playback is implemented in your application,
            # you should stop playing audio and clear queued playback here.

### JavaScript

    const turns = await handleTurn();

    for (const turn of turns) {
      if (turn.serverContent && turn.serverContent.interrupted) {
        // The generation was interrupted

        // If realtime playback is implemented in your application,
        // you should stop playing audio and clear queued playback here.
      }
    }

### Automatic VAD

By default, the model automatically performs VAD on
a continuous audio input stream. VAD can be configured with the
[`realtimeInputConfig.automaticActivityDetection`](https://ai.google.dev/api/live#RealtimeInputConfig.AutomaticActivityDetection)
field of the [setup configuration](https://ai.google.dev/api/live#BidiGenerateContentSetup).

When the audio stream is paused for more than a second (for example,
because the user switched off the microphone), an
[`audioStreamEnd`](https://ai.google.dev/api/live#BidiGenerateContentRealtimeInput.FIELDS.bool.BidiGenerateContentRealtimeInput.audio_stream_end)
event should be sent to flush any cached audio. The client can resume sending
audio data at any time.  

### Python

    # example audio file to try:
    # URL = "https://storage.googleapis.com/generativeai-downloads/data/hello_are_you_there.pcm"
    # !wget -q $URL -O sample.pcm
    import asyncio
    from pathlib import Path
    from google import genai
    from google.genai import types

    client = genai.Client()
    model = "gemini-live-2.5-flash-preview"

    config = {"response_modalities": ["TEXT"]}

    async def main():
        async with client.aio.live.connect(model=model, config=config) as session:
            audio_bytes = Path("sample.pcm").read_bytes()

            await session.send_realtime_input(
                audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
            )

            # if stream gets paused, send:
            # await session.send_realtime_input(audio_stream_end=True)

            async for response in session.receive():
                if response.text is not None:
                    print(response.text)

    if __name__ == "__main__":
        asyncio.run(main())

### JavaScript

    // example audio file to try:
    // URL = "https://storage.googleapis.com/generativeai-downloads/data/hello_are_you_there.pcm"
    // !wget -q $URL -O sample.pcm
    import { GoogleGenAI, Modality } from '@google/genai';
    import * as fs from "node:fs";

    const ai = new GoogleGenAI({});
    const model = 'gemini-live-2.5-flash-preview';
    const config = { responseModalities: [Modality.TEXT] };

    async function live() {
      const responseQueue = [];

      async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
          message = responseQueue.shift();
          if (message) {
            done = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return message;
      }

      async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
          const message = await waitMessage();
          turns.push(message);
          if (message.serverContent && message.serverContent.turnComplete) {
            done = true;
          }
        }
        return turns;
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: function () {
            console.debug('Opened');
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.debug('Error:', e.message);
          },
          onclose: function (e) {
            console.debug('Close:', e.reason);
          },
        },
        config: config,
      });

      // Send Audio Chunk
      const fileBuffer = fs.readFileSync("sample.pcm");
      const base64Audio = Buffer.from(fileBuffer).toString('base64');

      session.sendRealtimeInput(
        {
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000"
          }
        }

      );

      // if stream gets paused, send:
      // session.sendRealtimeInput({ audioStreamEnd: true })

      const turns = await handleTurn();
      for (const turn of turns) {
        if (turn.text) {
          console.debug('Received text: %s\n', turn.text);
        }
        else if (turn.data) {
          console.debug('Received inline data: %s\n', turn.data);
        }
      }

      session.close();
    }

    async function main() {
      await live().catch((e) => console.error('got error', e));
    }

    main();

With `send_realtime_input`, the API will respond to audio automatically based
on VAD. While `send_client_content` adds messages to the model context in
order, `send_realtime_input` is optimized for responsiveness at the expense of
deterministic ordering.

### Automatic VAD configuration

For more control over the VAD activity, you can configure the following
parameters. See [API reference](https://ai.google.dev/api/live#automaticactivitydetection) for more
info.  

### Python

    from google.genai import types

    config = {
        "response_modalities": ["TEXT"],
        "realtime_input_config": {
            "automatic_activity_detection": {
                "disabled": False, # default
                "start_of_speech_sensitivity": types.StartSensitivity.START_SENSITIVITY_LOW,
                "end_of_speech_sensitivity": types.EndSensitivity.END_SENSITIVITY_LOW,
                "prefix_padding_ms": 20,
                "silence_duration_ms": 100,
            }
        }
    }

### JavaScript

    import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity } from '@google/genai';

    const config = {
      responseModalities: [Modality.TEXT],
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false, // default
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
          prefixPaddingMs: 20,
          silenceDurationMs: 100,
        }
      }
    };

### Disable automatic VAD

Alternatively, the automatic VAD can be disabled by setting
`realtimeInputConfig.automaticActivityDetection.disabled` to `true` in the setup
message. In this configuration the client is responsible for detecting user
speech and sending
[`activityStart`](https://ai.google.dev/api/live#BidiGenerateContentRealtimeInput.FIELDS.BidiGenerateContentRealtimeInput.ActivityStart.BidiGenerateContentRealtimeInput.activity_start)
and [`activityEnd`](https://ai.google.dev/api/live#BidiGenerateContentRealtimeInput.FIELDS.BidiGenerateContentRealtimeInput.ActivityEnd.BidiGenerateContentRealtimeInput.activity_end)
messages at the appropriate times. An `audioStreamEnd` isn't sent in
this configuration. Instead, any interruption of the stream is marked by
an `activityEnd` message.  

### Python

    config = {
        "response_modalities": ["TEXT"],
        "realtime_input_config": {"automatic_activity_detection": {"disabled": True}},
    }

    async with client.aio.live.connect(model=model, config=config) as session:
        # ...
        await session.send_realtime_input(activity_start=types.ActivityStart())
        await session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
        )
        await session.send_realtime_input(activity_end=types.ActivityEnd())
        # ...

### JavaScript

    const config = {
      responseModalities: [Modality.TEXT],
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: true,
        }
      }
    };

    session.sendRealtimeInput({ activityStart: {} })

    session.sendRealtimeInput(
      {
        audio: {
          data: base64Audio,
          mimeType: "audio/pcm;rate=16000"
        }
      }

    );

    session.sendRealtimeInput({ activityEnd: {} })

## Token count

You can find the total number of consumed tokens in the
[usageMetadata](https://ai.google.dev/api/live#usagemetadata) field of the returned server message.  

### Python

    async for message in session.receive():
        # The server will periodically send messages that include UsageMetadata.
        if message.usage_metadata:
            usage = message.usage_metadata
            print(
                f"Used {usage.total_token_count} tokens in total. Response token breakdown:"
            )
            for detail in usage.response_tokens_details:
                match detail:
                    case types.ModalityTokenCount(modality=modality, token_count=count):
                        print(f"{modality}: {count}")

### JavaScript

    const turns = await handleTurn();

    for (const turn of turns) {
      if (turn.usageMetadata) {
        console.debug('Used %s tokens in total. Response token breakdown:\n', turn.usageMetadata.totalTokenCount);

        for (const detail of turn.usageMetadata.responseTokensDetails) {
          console.debug('%s\n', detail);
        }
      }
    }

## Media resolution

You can specify the media resolution for the input media by setting the
`mediaResolution` field as part of the session configuration:  

### Python

    from google.genai import types

    config = {
        "response_modalities": ["AUDIO"],
        "media_resolution": types.MediaResolution.MEDIA_RESOLUTION_LOW,
    }

### JavaScript

    import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';

    const config = {
        responseModalities: [Modality.TEXT],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
    };

## Limitations

Consider the following limitations of the Live API
when you plan your project.

### Response modalities

You can only set one response modality (`TEXT` or `AUDIO`) per session in the
session configuration. Setting both results in a config error message. This
means that you can configure the model to respond with either text or audio,
but not both in the same session.

### Client authentication

The Live API only provides server-to-server authentication
by default. If you're implementing your Live API application
using a [client-to-server approach](https://ai.google.dev/gemini-api/docs/live#implementation-approach), you need to use
[ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) to mitigate security
risks.

### Session duration

Audio-only sessions are limited to 15 minutes,
and audio plus video sessions are limited to 2 minutes.
However, you can configure different [session management techniques](https://ai.google.dev/gemini-api/docs/live-session) for unlimited extensions on session duration.

### Context window

A session has a context window limit of:

- 128k tokens for [native audio output](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output) models
- 32k tokens for other Live API models

## Supported languages

Live API supports the following languages.
| **Note:** [Native audio output](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output) models automatically choose the appropriate language and don't support explicitly setting the language code.

|          Language          | BCP-47 Code |       Language        | BCP-47 Code |
|----------------------------|-------------|-----------------------|-------------|
| German (Germany)           | `de-DE`     | English (Australia)\* | `en-AU`     |
| English (UK)\*             | `en-GB`     | English (India)       | `en-IN`     |
| English (US)               | `en-US`     | Spanish (US)          | `es-US`     |
| French (France)            | `fr-FR`     | Hindi (India)         | `hi-IN`     |
| Portuguese (Brazil)        | `pt-BR`     | Arabic (Generic)      | `ar-XA`     |
| Spanish (Spain)\*          | `es-ES`     | French (Canada)\*     | `fr-CA`     |
| Indonesian (Indonesia)     | `id-ID`     | Italian (Italy)       | `it-IT`     |
| Japanese (Japan)           | `ja-JP`     | Turkish (Turkey)      | `tr-TR`     |
| Vietnamese (Vietnam)       | `vi-VN`     | Bengali (India)       | `bn-IN`     |
| Gujarati (India)\*         | `gu-IN`     | Kannada (India)\*     | `kn-IN`     |
| Marathi (India)            | `mr-IN`     | Malayalam (India)\*   | `ml-IN`     |
| Tamil (India)              | `ta-IN`     | Telugu (India)        | `te-IN`     |
| Dutch (Netherlands)        | `nl-NL`     | Korean (South Korea)  | `ko-KR`     |
| Mandarin Chinese (China)\* | `cmn-CN`    | Polish (Poland)       | `pl-PL`     |
| Russian (Russia)           | `ru-RU`     | Thai (Thailand)       | `th-TH`     |

*Languages marked with an asterisk* (\*) *are not available for [Native audio](https://ai.google.dev/gemini-api/docs/live-guide#native-audio-output)*.

## What's next

- Read the [Tool Use](https://ai.google.dev/gemini-api/docs/live-tools) and [Session Management](https://ai.google.dev/gemini-api/docs/live-session) guides for essential information on using the Live API effectively.
- Try the Live API in [Google AI Studio](https://aistudio.google.com/app/live).
- For more info about the Live API models, see [Gemini 2.0 Flash Live](https://ai.google.dev/gemini-api/docs/models#live-api) and [Gemini 2.5 Flash Native Audio](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-native-audio) on the Models page.
- Try more examples in the [Live API cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.ipynb), the [Live API Tools cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI_tools.ipynb), and the [Live API Get Started script](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.py).