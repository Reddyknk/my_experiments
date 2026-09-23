import os
import sys
import json
import requests
from google import genai
from google.genai import types

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

class GeminiService:
    def __init__(self, api_key=None):
        self.api_key = api_key or config.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                pass

    def list_active_models(self):
        """
        Queries Google AI Studio API for active models capable of synthesizing text.
        Returns list of model names.
        """
        fallback_models = [
            "gemma-4-26b-a4b-it",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ]

        if not self.api_key:
            return fallback_models

        try:
            if not self.client:
                self.client = genai.Client(api_key=self.api_key)

            models_list = []
            for m in self.client.models.list():
                # Filter for text generation models
                m_name = m.name.replace("models/", "")
                if "gemini" in m_name.lower() or "gemma" in m_name.lower():
                    models_list.append(m_name)

            if models_list:
                return sorted(list(set(models_list)))
        except Exception:
            pass

        return fallback_models

    def generate_completion(self, model_name, prompt, system_instruction=None, temperature=0.7, max_tokens=1024, custom_endpoint=None):
        """
        Calls Gemini API via Google genai SDK or sends request to custom endpoint.
        Returns (response_text, input_tokens, output_tokens, raw_payload).
        """
        if custom_endpoint and model_name == "Custom Model":
            return self._call_custom_endpoint(custom_endpoint, prompt, system_instruction, temperature, max_tokens)

        if not self.api_key:
            return "Error: GEMINI_API_KEY is missing from environment/config.", 0, 0, {}

        try:
            if not self.client:
                self.client = genai.Client(api_key=self.api_key)

            gen_config = types.GenerateContentConfig(
                temperature=float(temperature),
                max_output_tokens=int(max_tokens),
            )
            if system_instruction:
                gen_config.system_instruction = system_instruction

            # Make generate content call
            response = self.client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=gen_config
            )

            text_output = response.text if response.text else ""
            
            # Estimate token counts
            input_tokens = len(str(prompt).split()) + (len(str(system_instruction).split()) if system_instruction else 0)
            output_tokens = len(text_output.split())

            raw_payload = {
                "model": model_name,
                "prompt": prompt,
                "system_instruction": system_instruction,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "response_text": text_output
            }

            return text_output, input_tokens, output_tokens, raw_payload

        except Exception as e:
            err_msg = f"Gemini API Error: {str(e)}"
            return err_msg, 0, 0, {"error": str(e)}

    def _call_custom_endpoint(self, endpoint_url, prompt, system_instruction, temperature, max_tokens):
        """Dispatches request to an OpenAI-compatible custom HTTP endpoint."""
        try:
            payload = {
                "model": "custom",
                "messages": [
                    {"role": "system", "content": system_instruction or "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            res = requests.post(endpoint_url, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                usage = data.get("usage", {})
                in_toks = usage.get("prompt_tokens", len(prompt.split()))
                out_toks = usage.get("completion_tokens", len(content.split()))
                return content, in_toks, out_toks, data
            else:
                return f"Custom Endpoint Error (HTTP {res.status_code}): {res.text}", 0, 0, {"error": res.text}
        except Exception as e:
            return f"Failed to call Custom Endpoint: {str(e)}", 0, 0, {"error": str(e)}

gemini_service = GeminiService()
