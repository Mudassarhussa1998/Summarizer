import os
import tempfile
from typing import Optional, Dict, Any

try:
    import yt_dlp
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install with: pip install yt-dlp")
    raise

class AudioTranscriber:
    """Handles audio extraction and transcription from YouTube videos."""
    
    def __init__(self):
        """Initialize the audio transcriber."""
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True
        }
    
    def download_and_transcribe_audio(self, url: str, method: str = 'google') -> Optional[str]:
        """Download audio from YouTube and transcribe using speech recognition.
        
        Args:
            url: YouTube video URL
            method: Transcription method ('google', 'sphinx', 'wit', 'azure', 'ibm')
            
        Returns:
            str: Transcribed text or error message
        """
        try:
            # Check if speech_recognition is available
            import speech_recognition as sr
        except ImportError:
            return "Audio transcription failed: speech_recognition library not installed. Install with: pip install SpeechRecognition"
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                audio_file = os.path.join(temp_dir, "audio.wav")
                
                # Update output template for temporary directory
                ydl_opts = self.ydl_opts.copy()
                ydl_opts['outtmpl'] = audio_file.replace('.wav', '.%(ext)s')
                
                # Download audio
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                
                # Find the downloaded audio file
                audio_files = [f for f in os.listdir(temp_dir) if f.endswith('.wav')]
                if not audio_files:
                    return "Audio transcription failed: Could not download audio file"
                
                actual_audio_file = os.path.join(temp_dir, audio_files[0])
                
                # Transcribe audio
                return self._transcribe_audio_file(actual_audio_file, method)
                
        except Exception as e:
            return f"Audio transcription failed: {str(e)}"
    
    def _transcribe_audio_file(self, audio_file_path: str, method: str = 'google') -> str:
        """Transcribe audio file using speech recognition.
        
        Args:
            audio_file_path: Path to the audio file
            method: Transcription method
            
        Returns:
            Transcribed text
        """
        try:
            import speech_recognition as sr
            
            recognizer = sr.Recognizer()
            
            # Load audio file
            with sr.AudioFile(audio_file_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=1)
                audio_data = recognizer.record(source)
            
            # Transcribe based on method
            if method == 'google':
                return recognizer.recognize_google(audio_data)
            elif method == 'sphinx':
                try:
                    return recognizer.recognize_sphinx(audio_data)
                except sr.RequestError:
                    return "Sphinx recognition not available. Install with: pip install pocketsphinx"
            elif method == 'wit':
                # Note: Requires Wit.ai API key
                return "Wit.ai transcription requires API key configuration"
            elif method == 'azure':
                # Note: Requires Azure Speech Services configuration
                return "Azure Speech Services transcription requires API key configuration"
            elif method == 'ibm':
                # Note: Requires IBM Watson configuration
                return "IBM Watson transcription requires API key configuration"
            else:
                return f"Unknown transcription method: {method}"
                
        except sr.UnknownValueError:
            return "Audio transcription failed: Could not understand audio"
        except sr.RequestError as e:
            return f"Audio transcription failed: {str(e)}"
        except Exception as e:
            return f"Audio transcription failed: {str(e)}"
    
    def transcribe_audio_chunks(self, url: str, chunk_duration: int = 60, method: str = 'google') -> Dict[str, Any]:
        """Transcribe audio in chunks for better accuracy with long videos.
        
        Args:
            url: YouTube video URL
            chunk_duration: Duration of each chunk in seconds
            method: Transcription method
            
        Returns:
            Dict containing transcription results
        """
        try:
            # Check if pydub is available for audio chunking
            from pydub import AudioSegment
        except ImportError:
            return {
                'error': 'Audio chunking requires pydub. Install with: pip install pydub',
                'transcript': '',
                'chunks': []
            }
        
        try:
            import speech_recognition as sr
        except ImportError:
            return {
                'error': 'speech_recognition library not installed. Install with: pip install SpeechRecognition',
                'transcript': '',
                'chunks': []
            }
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                audio_file = os.path.join(temp_dir, "audio.wav")
                
                # Download audio
                ydl_opts = self.ydl_opts.copy()
                ydl_opts['outtmpl'] = audio_file.replace('.wav', '.%(ext)s')
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                
                # Find the downloaded audio file
                audio_files = [f for f in os.listdir(temp_dir) if f.endswith('.wav')]
                if not audio_files:
                    return {
                        'error': 'Could not download audio file',
                        'transcript': '',
                        'chunks': []
                    }
                
                actual_audio_file = os.path.join(temp_dir, audio_files[0])
                
                # Load and chunk audio
                audio = AudioSegment.from_wav(actual_audio_file)
                chunk_length_ms = chunk_duration * 1000
                
                chunks = []
                full_transcript = []
                
                for i, chunk_start in enumerate(range(0, len(audio), chunk_length_ms)):
                    chunk_end = min(chunk_start + chunk_length_ms, len(audio))
                    chunk = audio[chunk_start:chunk_end]
                    
                    # Export chunk to temporary file
                    chunk_file = os.path.join(temp_dir, f"chunk_{i}.wav")
                    chunk.export(chunk_file, format="wav")
                    
                    # Transcribe chunk
                    chunk_transcript = self._transcribe_audio_file(chunk_file, method)
                    
                    chunk_info = {
                        'index': i,
                        'start_time': chunk_start // 1000,
                        'end_time': chunk_end // 1000,
                        'transcript': chunk_transcript
                    }
                    
                    chunks.append(chunk_info)
                    
                    if not chunk_transcript.startswith('Audio transcription failed'):
                        full_transcript.append(chunk_transcript)
                
                return {
                    'transcript': ' '.join(full_transcript),
                    'chunks': chunks,
                    'total_chunks': len(chunks),
                    'method': method
                }
                
        except Exception as e:
            return {
                'error': f'Chunked transcription failed: {str(e)}',
                'transcript': '',
                'chunks': []
            }
    
    def get_available_methods(self) -> Dict[str, Dict[str, Any]]:
        """Get information about available transcription methods.
        
        Returns:
            Dict containing method information
        """
        methods = {
            'google': {
                'name': 'Google Speech Recognition',
                'description': 'Free online speech recognition service',
                'requires_api_key': False,
                'requires_internet': True,
                'accuracy': 'High',
                'languages': 'Many'
            },
            'sphinx': {
                'name': 'CMU Sphinx',
                'description': 'Offline speech recognition',
                'requires_api_key': False,
                'requires_internet': False,
                'accuracy': 'Medium',
                'languages': 'Limited',
                'additional_install': 'pip install pocketsphinx'
            },
            'wit': {
                'name': 'Wit.ai',
                'description': 'Facebook\'s speech recognition service',
                'requires_api_key': True,
                'requires_internet': True,
                'accuracy': 'High',
                'languages': 'Many'
            },
            'azure': {
                'name': 'Azure Speech Services',
                'description': 'Microsoft\'s speech recognition service',
                'requires_api_key': True,
                'requires_internet': True,
                'accuracy': 'Very High',
                'languages': 'Many',
                'additional_install': 'pip install azure-cognitiveservices-speech'
            },
            'ibm': {
                'name': 'IBM Watson Speech to Text',
                'description': 'IBM\'s speech recognition service',
                'requires_api_key': True,
                'requires_internet': True,
                'accuracy': 'High',
                'languages': 'Many',
                'additional_install': 'pip install ibm-watson'
            }
        }
        
        return methods
    
    def test_transcription_setup(self) -> Dict[str, Any]:
        """Test if transcription dependencies are properly installed.
        
        Returns:
            Dict containing setup status
        """
        status = {
            'speech_recognition': False,
            'pyaudio': False,
            'pydub': False,
            'ffmpeg': False,
            'errors': []
        }
        
        # Test speech_recognition
        try:
            import speech_recognition as sr
            status['speech_recognition'] = True
        except ImportError:
            status['errors'].append('speech_recognition not installed. Install with: pip install SpeechRecognition')
        
        # Test pyaudio
        try:
            import pyaudio
            status['pyaudio'] = True
        except ImportError:
            status['errors'].append('pyaudio not installed. Install with: pip install pyaudio')
        
        # Test pydub
        try:
            from pydub import AudioSegment
            status['pydub'] = True
        except ImportError:
            status['errors'].append('pydub not installed (optional for chunking). Install with: pip install pydub')
        
        # Test ffmpeg availability
        try:
            import subprocess
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
            status['ffmpeg'] = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            status['errors'].append('ffmpeg not found. Install ffmpeg for audio processing.')
        
        return status