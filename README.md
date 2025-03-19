# BioForms

This project is a customized fork of the [CEDAR Template Editor](https://github.com/metadatacenter/cedar-template-editor), originally developed by the [CEDAR Project](https://metadatacenter.org/) at Stanford University.

# Table of Contents
1. [About the CEDAR Project](#about-the-cedar-project)
2. [Purpose of This Fork](#purpose-of-this-fork)
3. [Bioforms Architecture](#bioforms-architecture)
4. [Key Enhancements](#key-enhancements)
5. [Setting Up SharePoint Integration](#setting-up-sharepoint-integration)
6. [Handling Multiple Templates](#handling-multiple-templates)


## About the CEDAR Project

The CEDAR project aims to streamline data submission, making it smarter and faster for scientific researchers and analysts. By providing enhanced interfaces, controlled vocabularies, metadata best practices, and analytics, CEDAR improves metadata quality from provider to end user.

The full CEDAR project is available on their [GitHub repository](https://github.com/metadatacenter).

## Purpose of This Fork

Our institute, [IJC](https://www.carrerasresearch.org/), required a tool that could better capture metadata for all processed samples. While CEDAR provided most of the necessary functionality, we made modifications in two key areas:

1. **Look and Feel** - Customizing the UI to match our institute's design and enhancing spreadsheet functionality for bulk sample entry.
2. **Integration with Office 365** - Enabling form submission results to be exported in Excel format and stored in a dedicated SharePoint site.

## Bioforms Architecture
<img src="doc/architecture/architecture.drawio.svg">

## Key Enhancements

### 1. UI Customization

We modified the front-end module (`cedar-template-editor`) to align with our institute’s branding and improve usability. Additionally, we enhanced the spreadsheet functionality, allowing users to enter multiple samples in a structured tabular format more efficiently.

### 2. Office 365 Integration

To integrate with our existing workflows, we added functionality to export form responses in Excel format and store them in a SharePoint site managed by our IT department.

- **Data Submission:** Responses are still submitted to the CEDAR API ([CEDAR API Reference](https://resource.metadatacenter.org/api/)) but are also sent to SharePoint.
- **Backend Implementation:** A small Node.js backend processes form data, converts it into an Excel file, and uploads it to SharePoint using the [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/use-the-api).

## Setting Up SharePoint Integration

To enable SharePoint integration, follow these steps:

### 1. Configure Microsoft Entra ID (formerly Azure AD)

1. Create an application in your [Microsoft Entra Admin Center](https://entra.microsoft.com/#home).
2. Request admin approval for the `Sites.Selected` API permission.

### 2. Set Up a SharePoint Site

1. Create a SharePoint site for storing form responses.

2. Grant the application access to this site using Microsoft Graph API:

   ```
   POST https://graph.microsoft.com/v1.0/sites/{siteId}/permissions
   {
     "@odata.type": "#microsoft.graph.permission",
     "roles": ["write"],
     "grantedToIdentities": [{
       "application": {
         "id": "{clientId}"  // Your Application's Client ID
       }
     }]
   }
   ```

   Refer to the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/site-post-permissions?view=graph-rest-1.0\&tabs=http) for details.

> [!TIP]
   > Obtain the **siteId** using this API call:
   > ```
   > GET https://graph.microsoft.com/v1.0/sites/{tenant-name}.sharepoint.com:/sites/{site-name}
   > ```

  > [!TIP]
   > **site-name**: Extract from your SharePoint site URL.
   > ```
   > https://https://{tenant-name}.sharepoint.com/sites/{site-name}
   > ```

### 3. Configure Backend Authentication

1. Go to **Microsoft Entra Admin Center** → **Clients & Secrets** → **New Client Secret**.

2. Copy the **Client Secret Value** (visible only once).

3. Add an environment variable:

   ```sh
   GRAPH_API_CLIENT_SECRET=your_client_secret_here
   ```

4. Update authentication settings in:

   - `cedar-template-editor/api/src/graphAPI/appSettings.js` → Set **ClientId** and **TenantId**.
   - `cedar-template-editor/api/src/sharepoint/sharepointSettings.js` → Set **siteId** and **driveId**.

  > [!TIP]
  > Retrieve the **driveId** for SharePoint storage:
  >   ```
  >   GET https://graph.microsoft.com/v1.0/sites/{siteId}/drive
  >   ```

## Handling Multiple Templates

This guide explains how to manage multiple templates in BioForms by configuring NGINX and ensuring proper storage in CEDAR and SharePoint.

### 1. Prerequisites
- A BioForms account with access to CEDAR.
- A configured CEDAR directory for storing responses.
- NGINX installed and configured on your server.
- Access to a SharePoint server for storing Excel-formatted responses.

### 2. Creating a CEDAR Template and Directory
1. **Login to CEDAR** using the same account as BioForms.
2. **Create a new template** by following the CEDAR User Guide: [CEDAR User Guide](https://metadatacenter.readthedocs.io/en/latest/user-overview/)
3. **Copy the template ID** from the template URL, which follows this format:
   ```
   https://repo.metadatacenter.org/templates/{TEMPLATE_ID}
   ```
   Example:
   ```
   https://repo.metadatacenter.org/templates/3ae58251-34c2-4a0d-840d-cb17ea441ea0
   ```
4. **Create a directory** for storing responses and copy the folder ID:
   ```
   https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F{FOLDER_ID}
   ```
   Example:
   ```
   https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F2b1d7669-c3eb-4571-b22c-ec1c2cf0aeef
   ```

### 3. Configuring NGINX for Multiple Templates
To enable access to different templates using URL endpoints, update the NGINX configuration file (`config/default.conf`) with entries for each template.

#### Example NGINX Configuration:
```nginx
# Redirect genomica to its template
location /genomica {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    expires 0;
    return 302 $scheme://$host/instances/create/https://repo.metadatacenter.org/templates/3ae58251-34c2-4a0d-840d-cb17ea441ea0?folderId=https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F2b1d7669-c3eb-4571-b22c-ec1c2cf0aeef;
}

# Redirect test to its template
location /test {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    expires 0;
    return 302 $scheme://$host/instances/create/https://repo.metadatacenter.org/templates/efd7602c-4a02-45b6-a665-b5fb3360f066?folderId=https:%2F%2Frepo.metadatacenter.org%2Ffolders%2F02d81b00-f4b4-4467-8721-72a90c7998c2;
}
```

### 4. Accessing Forms
Once configured, users can access the templates using the following URLs:
- **Genomica Form:** `www.bioforms.carrerasresearch.org/genomica`
- **Test Form:** `www.bioforms.carrerasresearch.org/test`

### 5. Storing Responses
- **CEDAR Directory:** Responses will be automatically saved in the specified folder.
- **SharePoint Integration:**
  - A new folder will be created using the template name and folder ID.
  - Example folder name:
    ```
    TEMPLATE-NAME_02d81b00-f4b4-4467-8721-72a90c7998c2
    ```
  - Excel-formatted responses will be uploaded to the corresponding SharePoint folder.


## Conclusion

With these enhancements, we have tailored the CEDAR template editor to better serve our institute’s metadata needs while maintaining compatibility with the original CEDAR project. If you have any questions or need support, feel free to reach out!

