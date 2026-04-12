"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wrench,
  Code,
  Hash,
  Clock,
  Copy,
  Check,
  ArrowRightLeft,
  Braces,
  RefreshCw,
} from "lucide-react";

type ToolType = "json" | "base64" | "uuid" | "timestamp";

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export function QuickTools() {
  const [activeTool, setActiveTool] = useState<ToolType>("json");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [base64Output, setBase64Output] = useState("");
  const [uuidOutput, setUuidOutput] = useState(generateUUID());
  const [timestampInput, setTimestampInput] = useState(getCurrentTimestamp().toString());
  const [timestampOutput, setTimestampOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [encodeMode, setEncodeMode] = useState<"encode" | "decode">("encode");

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setJsonOutput(`Error: ${e instanceof Error ? e.message : "Invalid JSON"}`);
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
    } catch (e) {
      setJsonOutput(`Error: ${e instanceof Error ? e.message : "Invalid JSON"}`);
    }
  };

  const handleBase64 = () => {
    try {
      if (encodeMode === "encode") {
        setBase64Output(btoa(base64Input));
      } else {
        setBase64Output(atob(base64Input));
      }
    } catch (e) {
      setBase64Output(`Error: ${e instanceof Error ? e.message : "Invalid input"}`);
    }
  };

  const handleTimestampConvert = () => {
    const input = timestampInput.trim();
    if (/^\d+$/.test(input)) {
      setTimestampOutput(formatDate(parseInt(input, 10)));
    } else {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        setTimestampOutput(Math.floor(date.getTime() / 1000).toString());
      } else {
        setTimestampOutput("Invalid date format");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = [
    { id: "json", label: "JSON", icon: Braces },
    { id: "base64", label: "Base64", icon: ArrowRightLeft },
    { id: "uuid", label: "UUID", icon: Hash },
    { id: "timestamp", label: "Time", icon: Clock },
  ] as const;

  const renderToolContent = () => {
    switch (activeTool) {
      case "json":
        return (
          <div className="space-y-3">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"key": "value"}'
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-200 font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={formatJSON} size="sm" className="bg-orange-500 hover:bg-orange-600">
                Format
              </Button>
              <Button onClick={minifyJSON} size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                Minify
              </Button>
            </div>
            {jsonOutput && (
              <div className="relative">
                <Textarea
                  value={jsonOutput}
                  readOnly
                  className="min-h-[100px] bg-zinc-900 border-zinc-700 text-zinc-300 font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(jsonOutput)}
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>
        );

      case "base64":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant={encodeMode === "encode" ? "default" : "outline"}
                onClick={() => setEncodeMode("encode")}
                className={encodeMode === "encode" ? "bg-orange-500" : "border-zinc-700"}
              >
                Encode
              </Button>
              <Button
                size="sm"
                variant={encodeMode === "decode" ? "default" : "outline"}
                onClick={() => setEncodeMode("decode")}
                className={encodeMode === "decode" ? "bg-orange-500" : "border-zinc-700"}
              >
                Decode
              </Button>
            </div>
            <Textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder={encodeMode === "encode" ? "Text to encode" : "Base64 to decode"}
              className="min-h-[80px] bg-zinc-800 border-zinc-700 text-zinc-200 font-mono text-sm"
            />
            <Button onClick={handleBase64} size="sm" className="bg-orange-500 hover:bg-orange-600 w-full">
              {encodeMode === "encode" ? "Encode" : "Decode"}
            </Button>
            {base64Output && (
              <div className="relative">
                <Textarea
                  value={base64Output}
                  readOnly
                  className="min-h-[80px] bg-zinc-900 border-zinc-700 text-zinc-300 font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(base64Output)}
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>
        );

      case "uuid":
        return (
          <div className="space-y-3">
            <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <code className="text-zinc-200 font-mono text-sm break-all">{uuidOutput}</code>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setUuidOutput(generateUUID())}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 flex-1"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Generate
              </Button>
              <Button
                onClick={() => copyToClipboard(uuidOutput)}
                size="sm"
                variant="outline"
                className="border-zinc-700"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        );

      case "timestamp":
        return (
          <div className="space-y-3">
            <Input
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="Unix timestamp or date string"
              className="bg-zinc-800 border-zinc-700 text-zinc-200 font-mono"
            />
            <Button
              onClick={handleTimestampConvert}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 w-full"
            >
              Convert
            </Button>
            {timestampOutput && (
              <div className="relative">
                <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <code className="text-zinc-200 font-mono text-sm break-all">{timestampOutput}</code>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(timestampOutput)}
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-8 h-12 w-12 rounded-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-orange-500/50 shadow-lg z-40"
          title="Developer Tools"
        >
          <Wrench className="w-5 h-5 text-orange-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-zinc-900 border-zinc-800"
        align="end"
        side="top"
      >
        <Card className="bg-zinc-900 border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-orange-500" />
              Developer Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTool(tool.id as ToolType)}
                  className={`flex-1 gap-1 ${
                    activeTool === tool.id
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700"
                  }`}
                >
                  <tool.icon className="w-3 h-3" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
            {renderToolContent()}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}