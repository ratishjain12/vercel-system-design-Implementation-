import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const BACKEND_UPLOAD_URL = "http://localhost:3000";
const Landing = () => {
  const [uploadId, setUploadId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployed, setDeployed] = useState(false);
  const [uploading, setUploading] = useState(false);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Github Repo</CardTitle>
          <CardDescription>Paste repo link to deploy</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Github Repository"
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <Button
            onClick={async () => {
              setUploading(true);
              const res = await axios.post(`${BACKEND_UPLOAD_URL}/deploy`, {
                repoUrl: repoUrl,
              });
              setUploadId(res.data.id);
              setUploading(false);
              const interval = setInterval(async () => {
                const response = await axios.get(
                  `${BACKEND_UPLOAD_URL}/status?id=${res.data.id}`
                );

                if (response.data.status === "deployed") {
                  clearInterval(interval);
                  setDeployed(true);
                }
              }, 3000);
            }}
            disabled={uploadId !== "" || uploading}
            className="w-full mt-4"
            type="submit"
          >
            {uploadId
              ? `Deploying (${uploadId})`
              : uploading
              ? "Uploading..."
              : deployed
              ? "deployed"
              : "Upload"}
          </Button>
        </CardContent>
      </Card>
      {deployed && (
        <Card className="w-full mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Deployment Status</CardTitle>
            <CardDescription>
              Your website is successfully deployed!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="deployed-url">Deployed URL</Label>
              <Input
                id="deployed-url"
                readOnly
                type="url"
                value={`http://${uploadId}.vercelapp.com:3001/index.html`}
              />
            </div>
            <br />
            <Button className="w-full mt-4" variant="outline">
              <a
                href={`http://${uploadId}.vercelapp.com:3001/index.html`}
                target="_blank"
              >
                Visit Website
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};
export default Landing;
