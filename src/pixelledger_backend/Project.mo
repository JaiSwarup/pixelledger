import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class ProjectManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Create a new project - only Clients can create projects
    public func createProject(caller: Principal, input: Types.ProjectInput) : Types.AuthResult<Types.Project> {
      authManager.withClientAuth<Types.Project>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Project> {
        let project : Types.Project = {
          id = storage.nextProjectId;
          title = input.title;
          description = input.description;
          budget = input.budget;
          owner = caller;
          applicants = []; // Initialize as empty Principal array
          selectedCreative = null; // Initialize as no selected creative
          isCompleted = false;
        };

        Map.set(storage.projects, Map.nhash, storage.nextProjectId, project);
        // Initialize empty applicants list in separate storage
        Map.set(storage.projectApplicants, Map.nhash, storage.nextProjectId, []);
        storage.nextProjectId += 1;

        #ok(project)
      })
    };

    // Get all projects - any authenticated user can view
    public func getProjects(caller: Principal) : Types.AuthResult<[Types.Project]> {
      authManager.withAnyAuth<[Types.Project]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Project]> {
        // Return projects with updated applicant data
        let allProjects = Iter.toArray(Map.vals(storage.projects));
        let updatedProjects = Array.map<Types.Project, Types.Project>(allProjects, func(project: Types.Project) : Types.Project {
          // Get applicants from the separate storage
          let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          {
            id = project.id;
            title = project.title;
            description = project.description;
            budget = project.budget;
            owner = project.owner;
            applicants = applicants; // Use real applicant data
            selectedCreative = project.selectedCreative;
            isCompleted = project.isCompleted;
          }
        });
        #ok(updatedProjects)
      })
    };

    // Get a specific project by ID - any authenticated user can view
    public func getProjectById(caller: Principal, id: Nat) : Types.AuthResult<Types.Project> {
      authManager.withAnyAuth<Types.Project>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Project> {
        switch (Map.get(storage.projects, Map.nhash, id)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) { 
            // Get applicants from the separate storage
            let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
              case null { [] };
              case (?applicants) { applicants };
            };
            
            let updatedProject : Types.Project = {
              id = project.id;
              title = project.title;
              description = project.description;
              budget = project.budget;
              owner = project.owner;
              applicants = applicants; // Use real applicant data
              selectedCreative = project.selectedCreative;
              isCompleted = project.isCompleted;
            };
            #ok(updatedProject)
          };
        }
      })
    };

    // Apply to a project using Principal - only Creatives can apply
    public func applyToProject(caller: Principal, projectId: Nat) : Types.AuthResult<Text> {
      authManager.withCreativeAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        // Check if project exists
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            // Get current applicants for this project
            let currentApplicants = switch (Map.get(storage.projectApplicants, Map.nhash, projectId)) {
              case null { [] };
              case (?applicants) { applicants };
            };

            // Check if applicant already applied
            let alreadyApplied = Array.find<Principal>(currentApplicants, func(p: Principal) : Bool {
              Principal.equal(p, caller)
            });

            switch (alreadyApplied) {
              case (?_) { #err(#Unauthorized("Already applied to this project")) };
              case null {
                // Add applicant to the project
                let newApplicants = Array.append<Principal>(currentApplicants, [caller]);
                Map.set(storage.projectApplicants, Map.nhash, projectId, newApplicants);
                #ok("Successfully applied to project")
              };
            }
          };
        }
      })
    };

    // Get projects owned by the caller - only for Clients
    public func getMyProjects(caller: Principal) : Types.AuthResult<[Types.Project]> {
      authManager.withClientAuth<[Types.Project]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Project]> {
        let allProjects = Iter.toArray(Map.vals(storage.projects));
        let myProjects = Array.filter<Types.Project>(allProjects, func(project: Types.Project) : Bool {
          Principal.equal(project.owner, caller)
        });

        // Update applicant data for each project
        let updatedProjects = Array.map<Types.Project, Types.Project>(myProjects, func(project: Types.Project) : Types.Project {
          let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          {
            id = project.id;
            title = project.title;
            description = project.description;
            budget = project.budget;
            owner = project.owner;
            applicants = applicants;
            selectedCreative = project.selectedCreative;
            isCompleted = project.isCompleted;
          }
        });

        #ok(updatedProjects)
      })
    };

    // Get projects owned by a specific owner - any authenticated user can view
    public func getProjectsByOwner(caller: Principal, owner: Principal) : Types.AuthResult<[Types.Project]> {
      authManager.withAnyAuth<[Types.Project]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Project]> {
        let allProjects = Iter.toArray(Map.vals(storage.projects));
        let ownerProjects = Array.filter<Types.Project>(allProjects, func(project: Types.Project) : Bool {
          Principal.equal(project.owner, owner)
        });

        // Update applicant data for each project
        let updatedProjects = Array.map<Types.Project, Types.Project>(ownerProjects, func(project: Types.Project) : Types.Project {
          let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          {
            id = project.id;
            title = project.title;
            description = project.description;
            budget = project.budget;
            owner = project.owner;
            applicants = applicants;
            selectedCreative = project.selectedCreative;
            isCompleted = project.isCompleted;
          }
        });

        #ok(updatedProjects)
      })
    };

    // Get projects the caller has applied to - renamed for consistency
    public func getProjectsAppliedTo(caller: Principal) : Types.AuthResult<[Types.Project]> {
      getAppliedProjects(caller)
    };

    // Get approved applicants for a specific project - renamed for consistency  
    public func getProjectApprovedApplicants(caller: Principal, projectId: Nat) : Types.AuthResult<[Principal]> {
      getApprovedApplicants(caller, projectId)
    };

    // Check if an applicant is approved for a project
    public func isApplicantApproved(caller: Principal, projectId: Nat, applicant: Principal) : Types.AuthResult<Bool> {
      authManager.withAnyAuth<Bool>(caller, func(account: Types.UserAccount) : Types.AuthResult<Bool> {
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            let approved = switch (Map.get(storage.approvedApplicants, Map.nhash, projectId)) {
              case null { [] };
              case (?approved) { approved };
            };
            
            let isApproved = switch (Array.find<Principal>(approved, func(p: Principal) : Bool {
              Principal.equal(p, applicant)
            })) {
              case (?_) { true };
              case null { false };
            };
            
            #ok(isApproved)
          };
        }
      })
    };

    // Get projects the caller has applied to - only for Creatives
    public func getAppliedProjects(caller: Principal) : Types.AuthResult<[Types.Project]> {
      authManager.withCreativeAuth<[Types.Project]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Project]> {
        let allProjects = Iter.toArray(Map.vals(storage.projects));
        let appliedProjects = Array.filter<Types.Project>(allProjects, func(project: Types.Project) : Bool {
          // Check if caller is in the applicants list for this project
          let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          switch (Array.find<Principal>(applicants, func(p: Principal) : Bool {
            Principal.equal(p, caller)
          })) {
            case (?_) { true };
            case null { false };
          }
        });

        // Update applicant data for each project
        let updatedProjects = Array.map<Types.Project, Types.Project>(appliedProjects, func(project: Types.Project) : Types.Project {
          let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, project.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          {
            id = project.id;
            title = project.title;
            description = project.description;
            budget = project.budget;
            owner = project.owner;
            applicants = applicants;
            selectedCreative = project.selectedCreative;
            isCompleted = project.isCompleted;
          }
        });

        #ok(updatedProjects)
      })
    };

    // Approve an applicant for a project - only project owner can approve
    public func approveApplicant(caller: Principal, projectId: Nat, applicant: Principal) : Types.AuthResult<Text> {
      authManager.withClientAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        // Check if project exists and caller is the owner
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            if (not Principal.equal(project.owner, caller)) {
              #err(#Unauthorized("Only project owner can approve applicants"))
            } else {
              // Get current approved applicants
              let currentApproved = switch (Map.get(storage.approvedApplicants, Map.nhash, projectId)) {
                case null { [] };
                case (?approved) { approved };
              };

              // Check if already approved
              let alreadyApproved = Array.find<Principal>(currentApproved, func(p: Principal) : Bool {
                Principal.equal(p, applicant)
              });

              switch (alreadyApproved) {
                case (?_) { #err(#Unauthorized("Applicant already approved")) };
                case null {
                  // Add to approved list
                  let newApproved = Array.append<Principal>(currentApproved, [applicant]);
                  Map.set(storage.approvedApplicants, Map.nhash, projectId, newApproved);
                  #ok("Applicant approved successfully")
                };
              }
            }
          };
        }
      })
    };

    // Complete a project - only project owner can complete
    public func completeProject(caller: Principal, projectId: Nat) : Types.AuthResult<Text> {
      authManager.withClientAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            if (not Principal.equal(project.owner, caller)) {
              #err(#Unauthorized("Only project owner can complete projects"))
            } else if (project.isCompleted) {
              #err(#Unauthorized("Project already completed"))
            } else {
              let updatedProject : Types.Project = {
                id = project.id;
                title = project.title;
                description = project.description;
                budget = project.budget;
                owner = project.owner;
                applicants = project.applicants;
                selectedCreative = project.selectedCreative;
                isCompleted = true;
              };
              
              Map.set(storage.projects, Map.nhash, projectId, updatedProject);
              #ok("Project completed successfully")
            }
          };
        }
      })
    };

    // Get applicants for a specific project - only project owner can view
    public func getProjectApplicants(caller: Principal, projectId: Nat) : Types.AuthResult<[Principal]> {
      authManager.withClientAuth<[Principal]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Principal]> {
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            if (not Principal.equal(project.owner, caller)) {
              #err(#Unauthorized("Only project owner can view applicants"))
            } else {
              let applicants = switch (Map.get(storage.projectApplicants, Map.nhash, projectId)) {
                case null { [] };
                case (?applicants) { applicants };
              };
              #ok(applicants)
            }
          };
        }
      })
    };

    // Get approved applicants for a specific project - only project owner can view
    public func getApprovedApplicants(caller: Principal, projectId: Nat) : Types.AuthResult<[Principal]> {
      authManager.withClientAuth<[Principal]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Principal]> {
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            if (not Principal.equal(project.owner, caller)) {
              #err(#Unauthorized("Only project owner can view approved applicants"))
            } else {
              let approved = switch (Map.get(storage.approvedApplicants, Map.nhash, projectId)) {
                case null { [] };
                case (?approved) { approved };
              };
              #ok(approved)
            }
          };
        }
      })
    };

    // Select a creative for a project - only project owner can select
    public func selectCreative(caller: Principal, projectId: Nat, creative: Principal) : Types.AuthResult<Text> {
      authManager.withClientAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        switch (Map.get(storage.projects, Map.nhash, projectId)) {
          case null { #err(#Unauthorized("Project not found")) };
          case (?project) {
            if (not Principal.equal(project.owner, caller)) {
              #err(#Unauthorized("Only project owner can select creative"))
            } else {
              // Check if the creative is an approved applicant
              let approved = switch (Map.get(storage.approvedApplicants, Map.nhash, projectId)) {
                case null { [] };
                case (?approved) { approved };
              };
              
              let isApproved = switch (Array.find<Principal>(approved, func(p: Principal) : Bool {
                Principal.equal(p, creative)
              })) {
                case (?_) { true };
                case null { false };
              };
              
              if (not isApproved) {
                #err(#Unauthorized("Creative must be an approved applicant"))
              } else {
                // Update the project with the selected creative
                let updatedProject = {
                  id = project.id;
                  title = project.title;
                  description = project.description;
                  budget = project.budget;
                  owner = project.owner;
                  applicants = project.applicants;
                  selectedCreative = ?creative;
                  isCompleted = project.isCompleted;
                };
                
                Map.set(storage.projects, Map.nhash, projectId, updatedProject);
                #ok("Creative selected successfully")
              }
            }
          };
        }
      })
    };
  }
}
