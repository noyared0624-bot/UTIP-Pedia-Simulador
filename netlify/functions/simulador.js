export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { modo, modoJuego, promptUsuario, estadoActual, accionClinica } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `Eres un motor de simulación fisiopatológica de alta fidelidad y tutor médico de Pediatría Intensiva (UTIP) y Urgencias Pediátricas (PALS).
Reglas estrictas:
1. TIEMPO DE PROCEDIMIENTOS: Calcula "minutos_consumidos" de forma realista según la intervención (ej. examen físico o pregunta a padres: 2 min; bolo IV: 5 min; SRI + intubación: 4 min; CVC o línea arterial: 12 min; ajuste de ventilador: 2 min; ciclo RCP: 2 min).
2. DEMORA DE ESTUDIOS ("demora_entrega_min"): Si se pide gasometría o glicemia capilar = 2 min; Rx portátil o POCUS = 4 min; Hemograma/Química/Coagulación = 10 min; Cultivos = 999 (pendiente a 48h).
3. FEEDBACK DOCENTE ("feedback_tutor_inmediato"): Explica de forma clara, directa y académica por qué la intervención fue acertada, subóptima o peligrosa (dosis por kg, fisiopatología, elección de fármaco o parámetro ventilatorio) y qué vigilar a continuación.
4. PARO Y FALLECIMIENTO: Si el paciente sufre hipoxia grave prolongada, choque no reanimado o error crítico grave, entra en paro ("en_paro": true, "fc": 0, "pas": 0, "pad": 0, "spo2": 0, "ritmo_ecg": "Asistolia" | "AESP" | "FV" | "TVsp"). Si acumula >= 3 ciclos de paro sin RCP adecuada ni corrección de causa reversible, establece "fallecido": true.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional.`;

    let userPrompt = "";

    if (modo === "generar") {
      userPrompt = `Genera un caso clínico pediátrico realista basado en: "${promptUsuario}".
Devuelve exactamente este esquema JSON:
{
  "paciente": {
    "nombre_ficticio": "Iniciales ej. M.A.R.",
    "edad_texto": "ej. 2 años 4 meses",
    "edad_anos": 2.33,
    "peso_kg": 13.0,
    "talla_cm": 88,
    "anamnesis": "Motivo de consulta y cuadro actual al llegar a urgencias.",
    "info_oculta_padres": "Datos adicionales que la madre/padre solo dirá si el médico interroga (diuresis previa, medicamentos dados en casa, antecedentes perinatales, alergias).",
    "dx_oculto": "Diagnóstico definitivo completo",
    "fisiopatologia": "Explicación fisiopatológica detallada"
  },
  "estado": {
    "minuto": 0,
    "en_paro": false,
    "fallecido": false,
    "ciclos_rcp": 0,
    "fc": 168,
    "ritmo_ecg": "Taquicardia sinusal",
    "fr": 42,
    "pas": 82,
    "pad": 44,
    "spo2": 89,
    "etco2": 0,
    "temp": 39.2,
    "lc": 4,
    "gcs_detalle": "O3 V4 M5 (12/15)",
    "gcs_total": 12,
    "o2": "Aire ambiente (FiO2 21%)",
    "dispositivos": {
      "via_iv": false,
      "intraosea": false,
      "cvc": false,
      "linea_arterial": false,
      "sonda_vesical": false,
      "sonda_ng": false,
      "tet": null
    },
    "balance": {
      "ingresos_ml": 0,
      "egresos_ml": 0,
      "diuresis_ml_kg_h": null
    },
    "infusiones_activas": [],
    "examen_fisico": {
      "general": "Aspecto general, coloración, hidratación.",
      "neurologico": "Pupilas, tono, reflejos.",
      "respiratorio": "Mecánica ventilatoria y auscultación pulmonar.",
      "cardiovascular": "Pulsos centrales/periféricos, gradiente térmico, ruidos cardíacos.",
      "abdomen_renal": "Ruidos hidroaéreos, palpación abdominal."
    },
    "ventilador": {
      "activo": false,
      "modo": "PCV",
      "fio2": 40,
      "fr_prog": 24,
      "pip": 18,
      "vt_prog_ml_kg": 7,
      "peep": 5,
      "ti": 0.7,
      "vte_ml": 0,
      "vol_min": 0,
      "p_pico": 0,
      "p_meseta": 0,
      "driving_pressure": 0,
      "compliance": 0,
      "resistencia": 0,
      "pafi": 0
    }
  },
  "hallazgos_iniciales": "Resumen clínico al recibir al paciente en sala de choque."
}`;
    } else if (modo === "accion") {
      userPrompt = `Estado clínico actual (JSON): ${JSON.stringify(estadoActual)}
Nueva orden / pregunta a padres / maniobra: "${accionClinica}"

Evalúa rigorosamente la acción para un paciente de ${estadoActual.paciente.peso_kg} kg.
Suma "minutos_consumidos" a "estado_nuevo.minuto".
Si el médico interroga a los padres, responde en "respuesta_clinica" con la voz de la madre/padre usando "info_oculta_padres".
Si pide laboratorio o imagen, llénalo en "estudio_reportado" con su "demora_entrega_min".

Devuelve exactamente este JSON:
{
  "minutos_consumidos": 3,
  "estado_nuevo": {
    "minuto": 0,
    "en_paro": false,
    "fallecido": false,
    "ciclos_rcp": 0,
    "fc": 0,
    "ritmo_ecg": "texto",
    "fr": 0,
    "pas": 0,
    "pad": 0,
    "spo2": 0,
    "etco2": 0,
    "temp": 0.0,
    "lc": 0,
    "gcs_detalle": "O4 V5 M6 (15/15)",
    "gcs_total": 15,
    "o2": "texto",
    "dispositivos": {
      "via_iv": false,
      "intraosea": false,
      "cvc": false,
      "linea_arterial": false,
      "sonda_vesical": false,
      "sonda_ng": false,
      "tet": null
    },
    "balance": {
      "ingresos_ml": 0,
      "egresos_ml": 0,
      "diuresis_ml_kg_h": null
    },
    "infusiones_activas": [],
    "examen_fisico": {
      "general": "actualizado",
      "neurologico": "actualizado",
      "respiratorio": "actualizado",
      "cardiovascular": "actualizado",
      "abdomen_renal": "actualizado"
    },
    "ventilador": {
      "activo": false,
      "modo": "PCV",
      "fio2": 40,
      "fr_prog": 24,
      "pip": 18,
      "vt_prog_ml_kg": 7,
      "peep": 5,
      "ti": 0.7,
      "vte_ml": 0,
      "vol_min": 0,
      "p_pico": 0,
      "p_meseta": 0,
      "driving_pressure": 0,
      "compliance": 0,
      "resistencia": 0,
      "pafi": 0
    }
  },
  "respuesta_clinica": "Narrativa clínica o respuesta de los padres.",
  "tipo_alerta": "good | warn | crit",
  "feedback_tutor_inmediato": "Explicación docente detallada de por qué estuvo bien o mal esta acción y su base fisiopatológica.",
  "estudio_reportado": {
    "categoria": "gases | hemograma | quimica | imagen | null",
    "titulo": "Nombre del estudio o null",
    "contenido": "Reporte detallado con valores numéricos y unidades, o null",
    "demora_entrega_min": 0
  }
}`;
    } else if (modo === "evaluar") {
      userPrompt = `Realiza una auditoría clínica completa del manejo del caso (Modalidad: ${modoJuego}).
Paciente y diagnóstico real: ${JSON.stringify(estadoActual.paciente)}
Estado final alcanzado: ${JSON.stringify(estadoActual.estado)}
Historial cronológico de acciones: ${JSON.stringify(estadoActual.historial)}

Devuelve exactamente este JSON:
{
  "puntaje": 85,
  "desenlace_clinico": "Sobrevida estable / RCE post-paro / Fallecimiento por...",
  "diagnostico_definitivo": "Diagnóstico completo",
  "explicacion_fisiopatologica": "Explicación profunda de la fisiopatología y evolución del caso.",
  "aciertos": ["Acierto 1", "Acierto 2"],
  "errores_y_mejoras": ["Error o área de mejora 1 con fundamento fisiológico/farmacológico"],
  "perla_clinica": "Perla clínica clave para residentes e internos."
}`;
    }

    if (!apiKey) {
      throw new Error("Falta la variable GEMINI_API_KEY en Netlify.");
    }

    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.25
      }
    });

    // Reintenta automáticamente si Gemini está saturado (429/500/503).
    const MAX_INTENTOS = 3;
    let data = null;
    let ultimoError = "";
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody }
      );
      data = await response.json().catch(() => ({}));
      if (response.ok && data.candidates?.length) break;

      ultimoError = data.error?.message || `HTTP ${response.status}`;
      const reintentable = [429, 500, 503].includes(response.status);
      if (!reintentable || intento === MAX_INTENTOS) {
        throw new Error("Gemini: " + ultimoError);
      }
      await new Promise(r => setTimeout(r, 1500 * intento));
    }

    let textResult = data.candidates[0].content?.parts?.[0]?.text || "";
    textResult = textResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    JSON.parse(textResult); // valida que sea JSON antes de enviarlo a la app

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: textResult
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error en el motor de simulación", detalle: error.message })
    };
  }
}
