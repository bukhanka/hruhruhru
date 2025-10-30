---
title: Sound effects
subtitle: Learn how to create high-quality sound effects from text with ElevenLabs.
---

## Overview

<script src="https://elevenlabs.io/player/audioNativeHelper.js" type="text/javascript"></script>

ElevenLabs [sound effects](/docs/api-reference/text-to-sound-effects/convert) API turns text descriptions into high-quality audio effects with precise control over timing, style and complexity. The model understands both natural language and audio terminology, enabling you to:

- Generate cinematic sound design for films & trailers
- Create custom sound effects for games & interactive media
- Produce Foley and ambient sounds for video content

Listen to an example:

<elevenlabs-audio-player
audio-title="Cinematic braam"
audio-src="https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/sfx-cinematic-braam.mp3"
/>

## Usage

Sound effects are generated using text descriptions & two optional parameters:

- **Duration**: Set a specific length for the generated audio (in seconds)

  - Default: Automatically determined based on the prompt
  - Range: 0.1 to 30 seconds
  - Cost: 40 credits per second when duration is specified

- **Looping**: Enable seamless looping for sound effects longer than 30 seconds

  - Creates sound effects that can be played on repeat without perceptible start/end points
  - Perfect for atmospheric sounds, ambient textures, and background elements
  - Example: Generate 30s of 'soft rain' then loop it endlessly for atmosphere in audiobooks, films, games

- **Prompt influence**: Control how strictly the model follows the prompt

  - High: More literal interpretation of the prompt
  - Low: More creative interpretation with added variations

<CardGroup cols={2}>
  <Card
    title="Developer quickstart"
    icon="duotone book-sparkles"
    href="/docs/cookbooks/sound-effects"
  >
    Learn how to integrate sound effects into your application.
  </Card>
  <Card
    title="Product guide"
    icon="duotone book-user"
    href="/docs/product-guides/playground/sound-effects"
  >
    Step-by-step guide for using sound effects in ElevenLabs.
  </Card>
</CardGroup>

### Prompting guide

#### Simple effects

For basic sound effects, use clear, concise descriptions:

- "Glass shattering on concrete"
- "Heavy wooden door creaking open"
- "Thunder rumbling in the distance"

<elevenlabs-audio-player
    audio-title="Wood chopping"
    audio-src="https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/sfx-wood-chopping.mp3"
/>

#### Complex sequences

For multi-part sound effects, describe the sequence of events:

- "Footsteps on gravel, then a metallic door opens"
- "Wind whistling through trees, followed by leaves rustling"
- "Sword being drawn, then clashing with another blade"

<elevenlabs-audio-player
    audio-title="Walking and then falling"
    audio-src="https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/sfx-walking-falling.mp3"
/>

#### Musical elements

The API also supports generation of musical components:

- "90s hip-hop drum loop, 90 BPM"
- "Vintage brass stabs in F minor"
- "Atmospheric synth pad with subtle modulation"

<elevenlabs-audio-player
    audio-title="90s drum loop"
    audio-src="https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/sfx-90s-drum-loop.mp3"
/>

#### Audio Terminology

Common terms that can enhance your prompts:

- **Impact**: Collision or contact sounds between objects, from subtle taps to dramatic crashes
- **Whoosh**: Movement through air effects, ranging from fast and ghostly to slow-spinning or rhythmic
- **Ambience**: Background environmental sounds that establish atmosphere and space
- **One-shot**: Single, non-repeating sound
- **Loop**: Repeating audio segment
- **Stem**: Isolated audio component
- **Braam**: Big, brassy cinematic hit that signals epic or dramatic moments, common in trailers
- **Glitch**: Sounds of malfunction, jittering, or erratic movement, useful for transitions and sci-fi
- **Drone**: Continuous, textured sound that creates atmosphere and suspense

## FAQ

<AccordionGroup>
  <Accordion title="What's the maximum duration for generated effects?">
    The maximum duration is 30 seconds per generation. For longer sequences, you can either generate
    multiple effects and combine them, or use the looping feature to create seamless repeating sound
    effects.
  </Accordion>
  <Accordion title="Can I generate music with this API?">
    Yes, you can generate musical elements like drum loops, bass lines, and melodic samples.
    However, for full music production, consider combining multiple generated elements.
  </Accordion>
  <Accordion title="How do I ensure consistent quality?">
    Use detailed prompts, appropriate duration settings, and high prompt influence for more
    predictable results. For complex sounds, generate components separately and combine them.
  </Accordion>
  <Accordion title="What audio formats are supported?">
    Generated audio is provided in MP3 format with professional-grade quality. For WAV downloads of
    non-looping sound effects, audio is delivered at 48kHz sample rate - the industry standard for
    film, TV, video, and game audio, ensuring no resampling is needed for professional workflows.
  </Accordion>
  <Accordion title="How do looping sound effects work?">
    Looping sound effects are designed to play seamlessly on repeat without noticeable start or end
    points. This is perfect for creating continuous atmospheric sounds, ambient textures, or
    background elements that need to play indefinitely. For example, you can generate 30 seconds of
    rain sounds and loop them endlessly for background atmosphere in audiobooks, films, or games.
  </Accordion>
</AccordionGroup>

# Create sound effect

POST https://api.elevenlabs.io/v1/sound-generation
Content-Type: application/json

Turn text into sound effects for your videos, voice-overs or video games using the most advanced sound effects models in the world.

Reference: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: Create sound effect
  version: endpoint_textToSoundEffects.convert
paths:
  /v1/sound-generation:
    post:
      operationId: convert
      summary: Create sound effect
      description: >-
        Turn text into sound effects for your videos, voice-overs or video games
        using the most advanced sound effects models in the world.
      tags:
        - - subpackage_textToSoundEffects
      parameters:
        - name: output_format
          in: query
          description: >-
            Output format of the generated audio. Formatted as
            codec_sample_rate_bitrate. So an mp3 with 22.05kHz sample rate at
            32kbs is represented as mp3_22050_32. MP3 with 192kbps bitrate
            requires you to be subscribed to Creator tier or above. PCM with
            44.1kHz sample rate requires you to be subscribed to Pro tier or
            above. Note that the μ-law format (sometimes written mu-law, often
            approximated as u-law) is commonly used for Twilio audio inputs.
          required: false
          schema:
            $ref: '#/components/schemas/V1SoundGenerationPostParametersOutputFormat'
        - name: xi-api-key
          in: header
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The generated sound effect as an MP3 file
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary
        '422':
          description: Validation Error
          content: {}
      requestBody:
        content:
          application/json:
            schema:
              $ref: >-
                #/components/schemas/Body_Sound_Generation_v1_sound_generation_post
components:
  schemas:
    V1SoundGenerationPostParametersOutputFormat:
      type: string
      enum:
        - value: mp3_22050_32
        - value: mp3_24000_48
        - value: mp3_44100_32
        - value: mp3_44100_64
        - value: mp3_44100_96
        - value: mp3_44100_128
        - value: mp3_44100_192
        - value: pcm_8000
        - value: pcm_16000
        - value: pcm_22050
        - value: pcm_24000
        - value: pcm_32000
        - value: pcm_44100
        - value: pcm_48000
        - value: ulaw_8000
        - value: alaw_8000
        - value: opus_48000_32
        - value: opus_48000_64
        - value: opus_48000_96
        - value: opus_48000_128
        - value: opus_48000_192
    Body_Sound_Generation_v1_sound_generation_post:
      type: object
      properties:
        text:
          type: string
        loop:
          type: boolean
        duration_seconds:
          type:
            - number
            - 'null'
          format: double
        prompt_influence:
          type:
            - number
            - 'null'
          format: double
        model_id:
          type: string
      required:
        - text

```

## SDK Code Examples

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

async function main() {
    const client = new ElevenLabsClient({
        environment: "https://api.elevenlabs.io",
    });
    await client.textToSoundEffects.convert({
        text: "Spacious braam suitable for high-impact movie trailer moments",
    });
}
main();

```

```python
from elevenlabs import ElevenLabs

client = ElevenLabs(
    base_url="https://api.elevenlabs.io"
)

client.text_to_sound_effects.convert(
    text="Spacious braam suitable for high-impact movie trailer moments"
)

```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://api.elevenlabs.io/v1/sound-generation"

	payload := strings.NewReader("{\n  \"text\": \"Spacious braam suitable for high-impact movie trailer moments\"\n}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("xi-api-key", "xi-api-key")
	req.Header.Add("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.elevenlabs.io/v1/sound-generation")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["xi-api-key"] = 'xi-api-key'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"text\": \"Spacious braam suitable for high-impact movie trailer moments\"\n}"

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.post("https://api.elevenlabs.io/v1/sound-generation")
  .header("xi-api-key", "xi-api-key")
  .header("Content-Type", "application/json")
  .body("{\n  \"text\": \"Spacious braam suitable for high-impact movie trailer moments\"\n}")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.elevenlabs.io/v1/sound-generation', [
  'body' => '{
  "text": "Spacious braam suitable for high-impact movie trailer moments"
}',
  'headers' => [
    'Content-Type' => 'application/json',
    'xi-api-key' => 'xi-api-key',
  ],
]);

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.elevenlabs.io/v1/sound-generation");
var request = new RestRequest(Method.POST);
request.AddHeader("xi-api-key", "xi-api-key");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"text\": \"Spacious braam suitable for high-impact movie trailer moments\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "xi-api-key": "xi-api-key",
  "Content-Type": "application/json"
]
let parameters = ["text": "Spacious braam suitable for high-impact movie trailer moments"] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.elevenlabs.io/v1/sound-generation")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```