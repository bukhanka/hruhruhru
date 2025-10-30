<br />

[Veo 3](https://deepmind.google/models/veo/) is Google's state-of-the-art model
for generating high-fidelity, 8-second 720p or 1080p videos from a text prompt,
featuring stunning realism and natively generated audio. You can access this
model programmatically using the Gemini API. Veo 3 excels at a wide range of
visual and cinematic styles. To learn more about the available Veo model
variants, see the [Model Versions](https://ai.google.dev/gemini-api/docs/video#model-versions) section.

Choose an example to see how to generate a video with dialogue, cinematic
realism, or creative animation:

Dialogue \& Sound Effects Cinematic Realism Creative Animation  

### Python

    import time
    from google import genai
    from google.genai import types

    client = genai.Client()

    prompt = """A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"""

    operation = client.models.generate_videos(
        model="veo-3.0-generate-001",
        prompt=prompt,
    )

    # Poll the operation status until the video is ready.
    while not operation.done:
        print("Waiting for video generation to complete...")
        time.sleep(10)
        operation = client.operations.get(operation)

    # Download the generated video.
    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)
    generated_video.video.save("dialogue_example.mp4")
    print("Generated video saved to dialogue_example.mp4")

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

    let operation = await ai.models.generateVideos({
        model: "veo-3.0-generate-001",
        prompt: prompt,
    });

    // Poll the operation status until the video is ready.
    while (!operation.done) {
        console.log("Waiting for video generation to complete...")
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({
            operation: operation,
        });
    }

    // Download the generated video.
    ai.files.download({
        file: operation.response.generatedVideos[0].video,
        downloadPath: "dialogue_example.mp4",
    });
    console.log(`Generated video saved to dialogue_example.mp4`);

### Go

    package main

    import (
        "context"
        "log"
        "os"
        "time"

        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }

        prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
        A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

        operation, _ := client.Models.GenerateVideos(
            ctx,
            "veo-3.0-generate-001",
            prompt,
            nil,
            nil,
        )

        // Poll the operation status until the video is ready.
        for !operation.Done {
        log.Println("Waiting for video generation to complete...")
            time.Sleep(10 * time.Second)
            operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
        }

        // Download the generated video.
        video := operation.Response.GeneratedVideos[0]
        client.Files.Download(ctx, video.Video, nil)
        fname := "dialogue_example.mp4"
        _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
        log.Printf("Generated video saved to %s\n", fname)
    }

### REST

    # Note: This script uses jq to parse the JSON response.
    # GEMINI API Base URL
    BASE_URL="https://generativelanguage.googleapis.com/v1beta"

    # Send request to generate video and capture the operation name into a variable.
    operation_name=$(curl -s "${BASE_URL}/models/veo-3.0-generate-001:predictLongRunning" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -X "POST" \
      -d '{
        "instances": [{
            "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That'\''s the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
          }
        ]
      }' | jq -r .name)

    # Poll the operation status until the video is ready
    while true; do
      # Get the full JSON status and store it in a variable.
      status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

      # Check the "done" field from the JSON stored in the variable.
      is_done=$(echo "${status_response}" | jq .done)

      if [ "${is_done}" = "true" ]; then
        # Extract the download URI from the final response.
        video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
        echo "Downloading video from: ${video_uri}"

        # Download the video using the URI and API key and follow redirects.
        curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
        break
      fi
      # Wait for 5 seconds before checking again.
      sleep 10
    done

## Generating videos from images

The following code demonstrates generating an image using [Imagen](https://ai.google.dev/gemini-api/docs/image-generation#imagen), then using that image as the
starting frame for generating video with Veo 3.  

### Python

    import time
    from google import genai

    client = genai.Client()

    prompt = "Panning wide shot of a calico kitten sleeping in the sunshine"

    # Step 1: Generate an image with Imagen.
    imagen = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=prompt,
    )

    # Step 2: Generate video with Veo 3 using the image.
    operation = client.models.generate_videos(
        model="veo-3.0-generate-001",
        prompt=prompt,
        image=imagen.generated_images[0].image,
    )

    # Poll the operation status until the video is ready.
    while not operation.done:
        print("Waiting for video generation to complete...")
        time.sleep(10)
        operation = client.operations.get(operation)

    # Download the video.
    video = operation.response.generated_videos[0]
    client.files.download(file=video.video)
    video.video.save("veo3_with_image_input.mp4")
    print("Generated video saved to veo3_with_image_input.mp4")

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    const prompt = "Panning wide shot of a calico kitten sleeping in the sunshine";

    // Step 1: Generate an image with Imagen.
    const imagenResponse = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
    });

    // Step 2: Generate video with Veo 3 using the image.
    let operation = await ai.models.generateVideos({
      model: "veo-3.0-generate-001",
      prompt: prompt,
      image: {
        imageBytes: imagenResponse.generatedImages[0].image.imageBytes,
        mimeType: "image/png",
      },
    });

    // Poll the operation status until the video is ready.
    while (!operation.done) {
      console.log("Waiting for video generation to complete...")
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    // Download the video.
    ai.files.download({
        file: operation.response.generatedVideos[0].video,
        downloadPath: "veo3_with_image_input.mp4",
    });
    console.log(`Generated video saved to veo3_with_image_input.mp4`);

### Go

    package main

    import (
        "context"
        "log"
        "os"
        "time"

        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }

        prompt := "Panning wide shot of a calico kitten sleeping in the sunshine"

        // Step 1: Generate an image with Imagen.
        imagenResponse, err := client.Models.GenerateImages(
            ctx,
            "imagen-4.0-generate-001",
            prompt,
            nil, // GenerateImagesConfig
        )
        if err != nil {
            log.Fatal(err)
        }

        // Step 2: Generate video with Veo 3 using the image.
        operation, err := client.Models.GenerateVideos(
            ctx,
            "veo-3.0-generate-001",
            prompt,
            imagenResponse.GeneratedImages[0].Image,
            nil, // GenerateVideosConfig
        )
        if err != nil {
            log.Fatal(err)
        }

        // Poll the operation status until the video is ready.
        for !operation.Done {
            log.Println("Waiting for video generation to complete...")
            time.Sleep(10 * time.Second)
            operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
        }

        // Download the video.
        video := operation.Response.GeneratedVideos[0]
        client.Files.Download(ctx, video.Video, nil)
        fname := "veo3_with_image_input.mp4"
        _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
        log.Printf("Generated video saved to %s\n", fname)
    }

## Veo API parameters and specifications

These are the parameters you can set in your API request to control the video
generation process.

|     Parameter      |                                                               Description                                                               |                          Veo 3 \& Veo 3 Fast                           |                                                       Veo 2                                                       |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `prompt`           | The text description for the video. Supports audio cues.                                                                                | `string`                                                               | `string`                                                                                                          |
| `negativePrompt`   | Text describing what not to include in the video.                                                                                       | `string`                                                               | `string`                                                                                                          |
| `image`            | An initial image to animate.                                                                                                            | `Image` object                                                         | `Image` object                                                                                                    |
| `aspectRatio`      | The video's aspect ratio.                                                                                                               | `"16:9"` (default, 720p \& 1080p), `"9:16"` (720p)                     | `"16:9"` (default, 720p), `"9:16"` (720p)                                                                         |
| `resolution`       | The video's aspect ratio.                                                                                                               | `"720p"` (default), `"1080p"` (16:9 only)                              | Unsupported                                                                                                       |
| `personGeneration` | Controls the generation of people. (See [Limitations](https://ai.google.dev/gemini-api/docs/video#limitations) for region restrictions) | Text-to-video: `"allow_all"` only Image-to-video: `"allow_adult"` only | Text-to-video: `"allow_all"`, `"allow_adult"`, `"dont_allow"` Image-to-video: `"allow_adult"`, and `"dont_allow"` |

Note that the `seed` parameter is also available for Veo 3 models.
It doesn't guarantee determinism, but slightly improves it.

You can customize your video generation by setting parameters in your request.
For example you can specify `negativePrompt` to guide the model.  

### Python

    import time
    from google import genai
    from google.genai import types

    client = genai.Client()

    operation = client.models.generate_videos(
        model="veo-3.0-generate-001",
        prompt="A cinematic shot of a majestic lion in the savannah.",
        config=types.GenerateVideosConfig(negative_prompt="cartoon, drawing, low quality"),
    )

    # Poll the operation status until the video is ready.
    while not operation.done:
        print("Waiting for video generation to complete...")
        time.sleep(10)
        operation = client.operations.get(operation)

    # Download the generated video.
    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)
    generated_video.video.save("parameters_example.mp4")
    print("Generated video saved to parameters_example.mp4")

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    let operation = await ai.models.generateVideos({
      model: "veo-3.0-generate-001",
      prompt: "A cinematic shot of a majestic lion in the savannah.",
      config: {
        aspectRatio: "16:9",
        negativePrompt: "cartoon, drawing, low quality"
      },
    });

    // Poll the operation status until the video is ready.
    while (!operation.done) {
      console.log("Waiting for video generation to complete...")
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    // Download the generated video.
    ai.files.download({
        file: operation.response.generatedVideos[0].video,
        downloadPath: "parameters_example.mp4",
    });
    console.log(`Generated video saved to parameters_example.mp4`);

### Go

    package main

    import (
        "context"
        "log"
        "os"
        "time"

        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }

        videoConfig := &genai.GenerateVideosConfig{
            AspectRatio: "16:9",
            NegativePrompt: "cartoon, drawing, low quality",
        }

        operation, _ := client.Models.GenerateVideos(
            ctx,
            "veo-3.0-generate-001",
            "A cinematic shot of a majestic lion in the savannah.",
            nil,
            videoConfig,
        )

        // Poll the operation status until the video is ready.
        for !operation.Done {
            log.Println("Waiting for video generation to complete...")
            time.Sleep(10 * time.Second)
            operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
        }

        // Download the generated video.
        video := operation.Response.GeneratedVideos[0]
        client.Files.Download(ctx, video.Video, nil)
        fname := "parameters_example.mp4"
        _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
        log.Printf("Generated video saved to %s\n", fname)
    }

### REST

    # Note: This script uses jq to parse the JSON response.
    # GEMINI API Base URL
    BASE_URL="https://generativelanguage.googleapis.com/v1beta"

    # Send request to generate video and capture the operation name into a variable.
    operation_name=$(curl -s "${BASE_URL}/models/veo-3.0-generate-001:predictLongRunning" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -X "POST" \
      -d '{
        "instances": [{
            "prompt": "A cinematic shot of a majestic lion in the savannah."
          }
        ],
        "parameters": {
          "aspectRatio": "16:9",
          "negativePrompt": "cartoon, drawing, low quality"
        }
      }' | jq -r .name)

    # Poll the operation status until the video is ready
    while true; do
      # Get the full JSON status and store it in a variable.
      status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

      # Check the "done" field from the JSON stored in the variable.
      is_done=$(echo "${status_response}" | jq .done)

      if [ "${is_done}" = "true" ]; then
        # Extract the download URI from the final response.
        video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
        echo "Downloading video from: ${video_uri}"

        # Download the video using the URI and API key and follow redirects.
        curl -L -o parameters_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
        break
      fi
      # Wait for 5 seconds before checking again.
      sleep 10
    done

## Handling asynchronous operations

Video generation is a computationally intensive task. When you send a request
to the API, it starts a long-running job and immediately returns an `operation` object.
You must then poll until the video is ready, which is indicated by the `done`
status being true.

The core of this process is a polling loop, which periodically checks the job's
status.  

### Python

    import time
    from google import genai
    from google.genai import types

    client = genai.Client()

    # After starting the job, you get an operation object.
    operation = client.models.generate_videos(
        model="veo-3.0-generate-001",
        prompt="A cinematic shot of a majestic lion in the savannah.",
    )

    # Alternatively, you can use operation.name to get the operation.
    operation = types.GenerateVideosOperation(name=operation.name)

    # This loop checks the job status every 10 seconds.
    while not operation.done:
        time.sleep(10)
        # Refresh the operation object to get the latest status.
        operation = client.operations.get(operation)

    # Once done, the result is in operation.response.
    # ... process and download your video ...

### JavaScript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    // After starting the job, you get an operation object.
    let operation = await ai.models.generateVideos({
      model: "veo-3.0-generate-001",
      prompt: "A cinematic shot of a majestic lion in the savannah.",
    });

    // Alternatively, you can use operation.name to get the operation.
    // operation = types.GenerateVideosOperation(name=operation.name)

    // This loop checks the job status every 10 seconds.
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Refresh the operation object to get the latest status.
        operation = await ai.operations.getVideosOperation({ operation });
    }

    // Once done, the result is in operation.response.
    // ... process and download your video ...

## Model features

|        Feature         |               Description               |                     Veo 3 \& Veo 3 Fast                      |                                Veo 2                                 |
|------------------------|-----------------------------------------|--------------------------------------------------------------|----------------------------------------------------------------------|
| **Audio**              | Natively generates audio with video.    | ✔️ Always on                                                 | ❌ Silent only                                                        |
| **Input Modalities**   | The type of input used for generation.  | Text-to-Video, Image-to-Video                                | Text-to-Video, Image-to-Video                                        |
| **Resolution**         | The output resolution of the video.     | 720p \& 1080p (16:9 only)                                    | 720p                                                                 |
| **Frame Rate**         | The output frame rate of the video.     | 24fps                                                        | 24fps                                                                |
| **Video Duration**     | Length of the generated video.          | 8 seconds                                                    | 5-8 seconds                                                          |
| **Videos per Request** | Number of videos generated per request. | 1                                                            | 1 or 2                                                               |
| **Status \& Details**  | Model availability and further details. | [Stable](https://ai.google.dev/gemini-api/docs/models#veo-3) | [Stable](https://ai.google.dev/gemini-api/docs/models#latest-stable) |

Check out the [Model versions](https://ai.google.dev/gemini-api/docs/video#model-versions) section, and the
[Pricing](https://ai.google.dev/gemini-api/docs/pricing#veo-3) and [Rate
limits](https://ai.google.dev/gemini-api/docs/rate-limits#veo-3) pages for more Veo usage details.

## Veo prompt guide

This section contains examples of videos you can create using Veo, and shows you
how to modify prompts to produce distinct results.

### Safety filters

Veo applies safety filters across Gemini to help ensure that
generated videos and uploaded photos don't contain offensive content.
Prompts that violate our [terms and guidelines](https://ai.google.dev/gemini-api/docs/usage-policies#abuse-monitoring) are blocked.

### Prompt writing basics

Good prompts are descriptive and clear. To get the most out of Veo, start with
identifying your core idea, refine your idea by adding keywords and modifiers,
and incorporate video-specific terminology into your prompts.

The following elements should be included in your prompt:

- **Subject** : The object, person, animal, or scenery that you want in your video, such as *cityscape* , *nature* , *vehicles* , or *puppies*.
- **Action** : What the subject is doing (for example, *walking* , *running* , or *turning their head*).
- **Style** : Specify creative direction using specific film style keywords, such as *sci-fi* , *horror film* , *film noir* , or animated styles like *cartoon*.
- **Camera positioning and motion** : \[Optional\] Control the camera's location and movement using terms like *aerial view* , *eye-level* , *top-down shot* , *dolly shot* , or *worms eye*.
- **Composition** : \[Optional\] How the shot is framed, such as *wide shot* , *close-up* , *single-shot* or *two-shot*.
- **Focus and lens effects** : \[Optional\] Use terms like *shallow focus* , *deep focus* , *soft focus* , *macro lens* , and *wide-angle lens* to achieve specific visual effects.
- **Ambiance** : \[Optional\] How the color and light contribute to the scene, such as *blue tones* , *night* , or *warm tones*.

#### More tips for writing prompts

- **Use descriptive language**: Use adjectives and adverbs to paint a clear picture for Veo.
- **Enhance the facial details** : Specify facial details as a focus of the photo like using the word *portrait* in the prompt.

*For more comprehensive prompting strategies, visit [Introduction to
prompt design](https://ai.google.dev/gemini-api/docs/prompting-intro).*

### Prompting for audio

With Veo 3, you can provide cues for sound effects, ambient noise, and dialogue.
The model captures the nuance of these cues to generate a synchronized
soundtrack.

- **Dialogue:** Use quotes for specific speech. (Example: "This must be the key," he murmured.)
- **Sound Effects (SFX):** Explicitly describe sounds. (Example: tires screeching loudly, engine roaring.)
- **Ambient Noise:** Describe the environment's soundscape. (Example: A faint, eerie hum resonates in the background.)

These videos demonstrate prompting Veo 3's audio generation with increasing
levels of detail.

|                                                                                                                                                                         **Prompt**                                                                                                                                                                          |                                           **Generated output**                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **More detail (Dialogue and Ambience)** A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. "This must be the key," he murmured, tracing the pattern. "What does it mean though?" she asked, puzzled, tilting her head. Damp stone, intricate carvings, hidden symbols. A faint, eerie hum resonates in the background. | ![Treasure hunters in a cave.](https://storage.googleapis.com/generativeai-downloads/images/cryptic.gif) |
| **Less detail (Dialogue)** Camping (Stop Motion): Camper: "I'm one with nature now!" Bear: "Nature would prefer some personal space".                                                                                                                                                                                                                       | ![Treasure hunters in a cave.](https://storage.googleapis.com/generativeai-downloads/images/camper.gif)  |

Try out these prompts yourself to hear the audio!

[Try Veo 3](https://deepmind.google/models/veo/)

### Using reference images to generate videos

You can animate everyday objects, bring drawings and paintings to life, and add
movement and sound to nature scenes, using Veo's [image-to-video](https://ai.google.dev/gemini-api/docs/video#generate-from-images) capability.

|                               **Prompt**                                |                                           **Generated output**                                           |
|-------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **Input Image (Generated by Imagen)** Bunny with a chocolate candy bar. | ![Bunny is running away.](https://ai.google.dev/static/gemini-api/docs/video/images/static_bunny.png)    |
| **Output Video (Generated by Veo 3)** Bunny runs away.                  | ![Bunny is running away.](https://ai.google.dev/static/gemini-api/docs/video/images/bunny_runs_away.gif) |

| **Tip:** For the best results and a more natural progression, select a photo closest to what you envision as the first scene of your video, since Veo uses the photo as the initial frame.

### Example prompts and output

This section presents several prompts, highlighting how descriptive details can
elevate the outcome of each video.

#### Icicles

This video demonstrates how you can use the elements of
[prompt writing basics](https://ai.google.dev/gemini-api/docs/video#basics) in your prompt.

|                                                                                                **Prompt**                                                                                                |                                                 **Generated output**                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Close up shot (composition) of melting icicles (subject) on a frozen rock wall (context) with cool blue tones (ambiance), zoomed in (camera motion) maintaining close-up detail of water drips (action). | ![Dripping icicles with a blue background.](https://storage.googleapis.com/generativeai-downloads/images/Icicles.gif) |

#### Man on the phone

These videos demonstrate how you can revise your prompt with increasingly
specific details to get Veo to refine the output to your liking.

|                                                                                                                                                                                                                                                                       **Prompt**                                                                                                                                                                                                                                                                       |                                             **Generated output**                                             |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| **Less detail** The camera dollies to show a close up of a desperate man in a green trench coat. He's making a call on a rotary-style wall phone with a green neon light. It looks like a movie scene.                                                                                                                                                                                                                                                                                                                                                 | ![Man talking on the phone.](https://storage.googleapis.com/generativeai-downloads/images/Desperate_Man.gif) |
| **More detail** A close-up cinematic shot follows a desperate man in a weathered green trench coat as he dials a rotary phone mounted on a gritty brick wall, bathed in the eerie glow of a green neon sign. The camera dollies in, revealing the tension in his jaw and the desperation etched on his face as he struggles to make the call. The shallow depth of field focuses on his furrowed brow and the black rotary phone, blurring the background into a sea of neon colors and indistinct shadows, creating a sense of urgency and isolation. | ![Man talking on the phone](https://storage.googleapis.com/generativeai-downloads/images/detail_call.gif)    |

#### Snow leopard

|                                                                                                                                                                                                                                                                 **Prompt**                                                                                                                                                                                                                                                                 |                                             **Generated output**                                              |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| **Simple prompt:** A cute creature with snow leopard-like fur is walking in winter forest, 3D cartoon style render.                                                                                                                                                                                                                                                                                                                                                                                                                        | ![Snow leopard is lethargic.](https://storage.googleapis.com/generativeai-downloads/images/snowleopard.gif)   |
| **Detailed prompt:** Create a short 3D animated scene in a joyful cartoon style. A cute creature with snow leopard-like fur, large expressive eyes, and a friendly, rounded form happily prances through a whimsical winter forest. The scene should feature rounded, snow-covered trees, gentle falling snowflakes, and warm sunlight filtering through the branches. The creature's bouncy movements and wide smile should convey pure delight. Aim for an upbeat, heartwarming tone with bright, cheerful colors and playful animation. | ![Snow leopard is running faster.](https://storage.googleapis.com/generativeai-downloads/images/snow-run.gif) |

### Examples by writing elements

These examples show you how to refine your prompts by each basic element.

#### Subject and context

Specify the main focus (subject) and the background or environment (context).

|                                                                          **Prompt**                                                                           |                                                 **Generated output**                                                 |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| An architectural rendering of a white concrete apartment building with flowing organic shapes, seamlessly blending with lush greenery and futuristic elements | ![Placeholder.](https://storage.googleapis.com/generativeai-downloads/images/architecture.gif)                       |
| A satellite floating through outer space with the moon and some stars in the background.                                                                      | ![Satellite floating in the atmosphere.](https://storage.googleapis.com/generativeai-downloads/images/satellite.gif) |

#### Action

Specify what the subject is doing (e.g., walking, running, or turning their
head).

|                                                 **Prompt**                                                 |                                            **Generated output**                                             |
|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| A wide shot of a woman walking along the beach, looking content and relaxed towards the horizon at sunset. | ![Sunset is absolutely beautiful.](https://storage.googleapis.com/generativeai-downloads/images/sunset.gif) |

#### Style

Add keywords to steer the generation toward a specific aesthetic (e.g., surreal,
vintage, futuristic, film noir).

|                                       **Prompt**                                        |                                                **Generated output**                                                |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Film noir style, man and woman walk on the street, mystery, cinematic, black and white. | ![Film noir style is absolutely beautiful.](https://storage.googleapis.com/generativeai-downloads/images/noir.gif) |

#### Camera motion and composition

Specify how the camera moves (POV shot, aerial view, tracking drone view) and
how the shot is framed (wide shot, close-up, low angle).

|                                   **Prompt**                                   |                                             **Generated output**                                             |
|--------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| A POV shot from a vintage car driving in the rain, Canada at night, cinematic. | ![Sunset is absolutely beautiful.](https://storage.googleapis.com/generativeai-downloads/images/car-pov.gif) |
| Extreme close-up of a an eye with city reflected in it.                        | ![Sunset is absolutely beautiful.](https://storage.googleapis.com/generativeai-downloads/images/eye.gif)     |

#### Ambiance

Color palettes and lighting influence the mood. Try terms like "muted orange
warm tones," "natural light," "sunrise," or "cool blue tones."

|                                         **Prompt**                                          |                                                  **Generated output**                                                  |
|---------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| A close-up of a girl holding adorable golden retriever puppy in the park, sunlight.         | ![A puppy in a young girl's arms.](https://ai.google.dev/static/gemini-api/docs/video/images/ambiance_puppy.gif)       |
| Cinematic close-up shot of a sad woman riding a bus in the rain, cool blue tones, sad mood. | ![A woman riding on a bus that feels sad.](https://ai.google.dev/static/gemini-api/docs/video/images/ambiance_sad.gif) |

### Negative prompts

Negative prompts specify elements you *don't* want in the video.

- ❌ Don't use instructive language like *no* or *don't*. (e.g., "No walls").
- ✅ Do describe what you don't want to see. (e.g., "wall, frame").

|                                                                            **Prompt**                                                                            |                                               **Generated output**                                                |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| **Without Negative Prompt:** Generate a short, stylized animation of a large, solitary oak tree with leaves blowing vigorously in a strong wind... \[truncated\] | ![Tree with using words.](https://ai.google.dev/static/gemini-api/docs/video/images/tree_with_no_negative.gif)    |
| **With Negative Prompt:** \[Same prompt\] <br /> Negative prompt: urban background, man-made structures, dark, stormy, or threatening atmosphere.                | ![Tree with no negative words.](https://ai.google.dev/static/gemini-api/docs/video/images/tree_with_negative.gif) |

### Aspect ratios

Veo lets you specify the aspect ratio for your video.

|                                                                                                                                                                                                                                                                    **Prompt**                                                                                                                                                                                                                                                                    |                                                                    **Generated output**                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Widescreen (16:9)** Create a video with a tracking drone view of a man driving a red convertible car in Palm Springs, 1970s, warm sunlight, long shadows.                                                                                                                                                                                                                                                                                                                                                                                      | ![A man driving a red convertible car in Palm Springs, 1970s style.](https://ai.google.dev/static/gemini-api/docs/video/images/widescreen_palm_springs.gif) |
| **Portrait (9:16 - Veo 2 only)** Create a video highlighting the smooth motion of a majestic Hawaiian waterfall within a lush rainforest. Focus on realistic water flow, detailed foliage, and natural lighting to convey tranquility. Capture the rushing water, misty atmosphere, and dappled sunlight filtering through the dense canopy. Use smooth, cinematic camera movements to showcase the waterfall and its surroundings. Aim for a peaceful, realistic tone, transporting the viewer to the serene beauty of the Hawaiian rainforest. | ![A majestic Hawaiian waterfall in a lush rainforest.](https://ai.google.dev/static/gemini-api/docs/video/images/waterfall.gif)                             |

## Limitations

- **Request latency:** Min: 11 seconds; Max: 6 minutes (during peak hours).
- **Regional limitations:** In EU, UK, CH, MENA locations, the following are the allowed values for `personGeneration`:
  - Veo 3: `allow_adult` only.
  - Veo 2: `dont_allow` and `allow_adult`. Default is `dont_allow`.
- **Video retention:** Generated videos are stored on the server for 2 days, after which they are removed. To save a local copy, you must download your video within 2 days of generation.
- **Watermarking:** Videos created by Veo are watermarked using [SynthID](https://deepmind.google/technologies/synthid/), our tool for watermarking and identifying AI-generated content.
- **Safety:** Generated videos are passed through safety filters and memorization checking processes that help mitigate privacy, copyright and bias risks.
- **Audio error:** Veo 3 will sometimes block a video from generating because of safety filters or other processing issues with the audio. You will not be charged if your video is blocked from generating.

## Model versions

### Veo 3

|          Property           |                    Description                    |
|-----------------------------|---------------------------------------------------|
| id_cardModel code           | **Gemini API** `veo-3.0-generate-001`             |
| saveSupported data types    | **Input** Text, Image **Output** Video with audio |
| token_autoLimits            | **Text input** 1,024 tokens **Output video** 1    |
| calendar_monthLatest update | July 2025                                         |

### Veo 3 Fast

Veo 3 Fast allows developers to create videos with sound while maintaining high quality and optimizing for speed and business use cases. It's ideal for backend services that programmatically generate ads, tools for rapid A/B testing of creative concepts, or apps that need to quickly produce social media content.

|          Property           |                    Description                    |
|-----------------------------|---------------------------------------------------|
| id_cardModel code           | **Gemini API** `veo-3.0-fast-generate-001`        |
| saveSupported data types    | **Input** Text, Image **Output** Video with audio |
| token_autoLimits            | **Text input** 1,024 tokens **Output video** 1    |
| calendar_monthLatest update | July 2025                                         |

### Veo 2

|          Property           |                                                      Description                                                       |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------|
| id_cardModel code           | **Gemini API** `veo-2.0-generate-001`                                                                                  |
| saveSupported data types    | **Input** Text, image **Output** Video                                                                                 |
| token_autoLimits            | **Text input** N/A **Image input** Any image resolution and aspect ratio up to 20MB file size **Output video** Up to 2 |
| calendar_monthLatest update | April 2025                                                                                                             |

## What's next

- Get started with the Veo 3 API by experimenting in the [Veo Quickstart Colab](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_Veo.ipynb).
- Learn how to write even better prompts with our [Introduction to prompt design](https://ai.google.dev/gemini-api/docs/prompting-intro).