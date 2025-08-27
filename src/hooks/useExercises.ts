// hooks/useExercises.ts
import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";

export type Exercise = {
  id: string;
  user_id: string;
  name: string;
  image_url?: string | null;
  created_at: string;
  is_public: boolean;
};

type AddPayload = { 
  name: string; 
  imageUri?: string | null;
  description?: string;
  steps: string[];
  muscles: string[];
  material: string[];
};

const BUCKET = "exercises";

// ---------------- Helpers ----------------

function guessExt(uri: string) {
  const m = uri.match(/\.(\w+)$/);
  return (m ? m[1] : "jpg").toLowerCase();
}

function mimeFromExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  return "application/octet-stream";
}

/** Decodifica base64 a Uint8Array (robusto, sin dependencias) */
function b64ToBytes(b64: string): Uint8Array {
  // limpiar saltos/espacios/char no base64
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lut = new Uint8Array(256);
  for (let i = 0; i < alphabet.length; i++) lut[alphabet.charCodeAt(i)] = i;

  const len = b64.length;
  let padding = 0;
  if (len >= 2) {
    if (b64[len - 1] === "=") padding++;
    if (b64[len - 2] === "=") padding++;
  }
  const outLen = ((len / 4) * 3) - padding;
  const out = new Uint8Array(outLen);

  let o = 0, i = 0;
  while (i < len) {
    const c1 = lut[b64.charCodeAt(i++)];
    const c2 = lut[b64.charCodeAt(i++)];
    const c3 = lut[b64.charCodeAt(i++)];
    const c4 = lut[b64.charCodeAt(i++)];
    const triple = (c1 << 18) | (c2 << 12) | ((c3 & 63) << 6) | (c4 & 63);
    if (o < outLen) out[o++] = (triple >> 16) & 0xff;
    if (o < outLen) out[o++] = (triple >> 8) & 0xff;
    if (o < outLen) out[o++] = triple & 0xff;
  }
  return out;
}

/** Lee SIEMPRE el file:// en base64 y lo convierte a bytes (evita 0B) */
async function bodyFromUri(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = b64ToBytes(base64);
  console.log("[upload] base64 length:", base64.length, "→ bytes:", bytes.byteLength);
  return bytes;
}

// ---------------- Hook ----------------

export function useExercises(userId?: string) {
  const [list, setList] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setList(data || []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar ejercicios");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickImage = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      // Compatible con tu SDK actual
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      base64: false, // no es necesario, leemos del uri con FileSystem
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }, []);

  const uploadToStorage = useCallback(async (localUri: string, uid: string) => {
    try {
      console.log("Subiendo imagen a Supabase Storage…");
      const ext = guessExt(localUri);
      const contentType = mimeFromExt(ext);
      const path = `${uid}/${Date.now()}.${ext}`;

      // 1) leer archivo → bytes (nunca 0B)
      const bytes = await bodyFromUri(localUri);
      if (!bytes.byteLength) throw new Error("El archivo leído tiene 0 bytes");
      console.log("[upload] final body size:", bytes.byteLength);

      // 2) subir ArrayBuffer con contentType correcto
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) {
        console.error("Error al subir archivo:", upErr.message);
        throw upErr;
      }

      // 3) URL del Image CDN (render). No uses HEAD; algunos devuelven 400.
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path, {
        transform: { width: 300, height: 200, resize: "cover", quality: 85 },
      });
      const publicUrl = pub.publicUrl;
      console.log("Imagen subida (render):", publicUrl);

      // Verificación con GET opcional
      try {
        const test = await fetch(publicUrl);
        console.log("GET test", test.status, test.headers.get("content-type"));
      } catch (e) {
        console.warn("No se pudo verificar con GET:", e);
      }

      return publicUrl;
    } catch (err) {
      console.error("Error en uploadToStorage:", err);
      throw err;
    }
  }, []);

  const add = useCallback(
    async ({ name, imageUri, description, steps, muscles, material }: AddPayload) => {
      if (!userId) throw new Error("No hay usuario");
      try {
        setSaving(true);

        let publicUrl: string | undefined;
        if (imageUri) {
          try {
            publicUrl = await uploadToStorage(imageUri, userId);
          } catch (imgError) {
            console.error("Error al subir la imagen, se guardará sin imagen:", imgError);
          }
        }

        const { data, error } = await supabase
          .from("exercises")
          .insert({ 
            user_id: userId, 
            name, 
            image_url: publicUrl,
            description,
            steps,
            muscles,
            material
          })
          .select("*")
          .single();

        if (error) throw error;

        setList((prev) => [data as Exercise, ...prev]);
        return data as Exercise;
      } catch (err) {
        console.error("Error al guardar el ejercicio:", err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [uploadToStorage, userId]
  );

  const remove = useCallback(
    async (exerciseId: string) => {
      if (!userId) throw new Error("No hay usuario");
      try {
        setLoading(true);
        
        // Eliminamos el ejercicio de la base de datos
        const { error } = await supabase
          .from("exercises")
          .delete()
          .eq("id", exerciseId)
          .eq("user_id", userId); // Verificación adicional de seguridad
        
        if (error) throw error;
        
        // Actualizamos la lista local
        setList(prev => prev.filter(ex => ex.id !== exerciseId));
        return true;
      } catch (err) {
        console.error("Error al eliminar el ejercicio:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return { list, loading, saving, error, load, add, remove, pickImage };
}
