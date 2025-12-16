import os
import wave
import struct

TARGET_DIR = 'assets/sounds'
MAX_DURATION = 3.5  # seconds

def trim_wav(filepath):
    try:
        with wave.open(filepath, 'rb') as wav_in:
            params = wav_in.getparams()
            nchannels, sampwidth, framerate, nframes, comptype, compname = params
            
            duration = nframes / float(framerate)
            
            if duration > MAX_DURATION:
                print(f"Trimming {filepath} (Duration: {duration:.2f}s)")
                max_frames = int(MAX_DURATION * framerate)
                frames = wav_in.readframes(max_frames)
                
                # Check for silence or issues? No, just trim.
                
                with wave.open(filepath, 'wb') as wav_out:
                    wav_out.setparams(params)
                    wav_out.setnframes(max_frames)
                    wav_out.writeframes(frames)
                    print(f"Trimmed {filepath} to {MAX_DURATION}s")
            else:
                print(f"{filepath} is OK ({duration:.2f}s)")
                
    except wave.Error as e:
        print(f"Error processing {filepath}: {e}")
    except Exception as e:
        print(f"General error on {filepath}: {e}")

if __name__ == '__main__':
    if not os.path.exists(TARGET_DIR):
        print(f"Directory {TARGET_DIR} not found")
        exit(1)
        
    for filename in os.listdir(TARGET_DIR):
        if filename.endswith('.wav'):
            trim_wav(os.path.join(TARGET_DIR, filename))
