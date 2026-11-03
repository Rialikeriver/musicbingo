## 🚨 Important Rule
**Do NOT code directly on `main`.**  
`main` should always be the **latest stable version** of the project.

**ALWAYS CHECK WHICH BRANCH YOU'RE ON BEFORE MAKING CHANGES.**  
make sure you're on your branch and not in `main` by using `git branch` before making any changes to files

That means:
- create a **branch**
- do your work there
- test it
- then merge it into `main`


## What These Words Mean (Simple)
- **Repository (repo)** = our project on GitHub
- **Clone** = copy the repo from GitHub to your computer
- **Branch** = your own copy of the code to safely work on
- **Commit** = save a checkpoint of your changes
- **Merge** = combine one branch with another
- **Push** = send your commits from your computer to GitHub
- **Pull** = get the latest changes from GitHub to your computer


## ✅ Project Workflow (Step by Step)

### 1) clone repo to your computer 
```
git clone <link>
```

### 2) Before starting work: get the latest `main`
Always do this before creating a new branch.

```
git branch  
git checkout main
git pull origin main
```

**What this does**
- `git branch` → shows the branch youre currently on
- `git checkout main` → switches you to the `main` branch
- `git pull origin main` → downloads the latest `main` from GitHub

### 3) Create your own branch for your task
Make a branch for the feature you are working on.

```
git checkout -b yourName
```

✅ Now you are working safely on your own branch (not on `main`).


### 4) Make your changes and commit them
After editing files, save your changes with a commit.

**Stage and commit**
```
git add .
git commit -m "Add login form UI"
```

✅ A commit is like a save point/checkpoint.


### 5) Push your branch to GitHub (recommended)
This backs up your work online and lets teammates see it if needed.

```
git push -u origin yourName
```


### 6) Update your branch with the latest `main`
This helps catch merge conflicts early.

```
git checkout main
git pull origin main    //VERY IMPORTANT STEP! Other teammates may have updated 'main' while you were working. 
git checkout yourName
git merge main
```
**This merges main into your branch which will help catch merge conflicts before updating main.

**What this means**  
You are **bringing the latest `main` into your branch** so your branch is up to date.

✅ This does **NOT** update `main` yet.  
It only updates **your branch**.


### 7) If there are merge conflicts, fix them
Sometimes Git will say there is a conflict (usually when two people changed the same lines).


### 8) Test your code
Before putting anything into `main`, make sure your code works.

Examples:
- app runs
- no obvious errors
- page loads
- feature works
- no broken code

✅ Only merge into `main` when your branch is stable.


### 9) Merge your branch into `main`
When your work is stable:

```
git checkout main
git merge yourName
git push -u origin main
```

**What this does**
- switches to `main`
- merges your branch into `main`
- pushes updated `main` to GitHub

✅ Now everyone can pull the latest stable version.
